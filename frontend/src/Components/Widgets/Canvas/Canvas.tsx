import type {
	PlacedDevice,
	Point,
	Room,
	Tool,
	ViewBox,
	Wall,
} from '@Types/mapEditorTypes'
import { useEffect, useRef, useState } from 'react'
import {
	centroid,
	constrainOrtho,
	dist,
	snapPoint,
} from '../../../Utils/geometry'
import styles from './Canvas.module.scss'

interface Props {
	walls: Wall[]
	rooms: Room[]
	tool: Tool
	gridSize: number
	thickness: number
	view: ViewBox
	setView: (v: ViewBox) => void
	onAddWall: (a: Point, b: Point, type: 'wall' | 'door') => void
	onDeleteWall: (w: Wall) => void
	onRenameRoom: (key: string, name: string) => void
	promptRoomKey: string | null
	onPromptDone: () => void
	onZoom: (factor: number) => void
	devices: PlacedDevice[]
	onDeviceMove: (id: string, pos: Point) => void
	onDeviceClick: (
		device: PlacedDevice,
		screenX: number,
		screenY: number,
	) => void
}

export const Canvas = ({
	walls,
	rooms,
	tool,
	gridSize,
	thickness,
	view,
	setView,
	onAddWall,
	onDeleteWall,
	onRenameRoom,
	promptRoomKey,
	onPromptDone,
	onZoom,
	devices,
	onDeviceMove,
	onDeviceClick,
}: Props) => {
	const svgRef = useRef<SVGSVGElement>(null)
	const erasing = useRef(false)

	// Состояние для рисования стен
	const [drag, setDrag] = useState<{
		start: Point
		current: Point
		sx: number
		sy: number
	} | null>(null)

	// Состояние для панорамирования (средняя кнопка мыши)
	const [pan, setPan] = useState<{
		x: number
		y: number
		view: ViewBox
	} | null>(null)

	// Храним локальный масштаб, безопасно инициализируем 1
	const [zoom, setZoom] = useState(1)

	// Состояние для перетаскивания устройства
	const [dragDevice, setDragDevice] = useState<{
		id: string
		offset: Point
		sx: number
		sy: number
	} | null>(null)

	// отслеживание активных указателей для pinch-zoom
	const pointers = useRef<Map<number, { x: number; y: number }>>(new Map())
	const pinch = useRef<{
		dist: number
		center: Point
		view: ViewBox
	} | null>(null)
	// Двухпальцевое панорамирование
	const twoFingerPan = useRef<{
		x: number
		y: number
		view: ViewBox
	} | null>(null)

	// Обновляем масштаб при изменении view или ресайзе окна
	useEffect(() => {
		const updateZoom = () => {
			if (svgRef.current && svgRef.current.clientWidth > 0) {
				setZoom(view.w / svgRef.current.clientWidth)
			}
		}
		updateZoom()
		window.addEventListener('resize', updateZoom)
		return () => window.removeEventListener('resize', updateZoom)
	}, [view.w])

	// Синхронизируем с родителем для панели
	useEffect(() => {
		onZoom(zoom)
	}, [zoom, onZoom])

	const toWorld = (e: { clientX: number; clientY: number }): Point => {
		const svg = svgRef.current
		if (!svg) return { x: 0, y: 0 }
		const pt = svg.createSVGPoint()
		pt.x = e.clientX
		pt.y = e.clientY
		const m = pt.matrixTransform(svg.getScreenCTM()!.inverse())
		return { x: m.x, y: m.y }
	}

	const snapToEndpoint = (
		p: Point,
		radius = 14,
		exclude: Point | null = null,
	): Point => {
		let best: Point | null = null
		let bestD = radius
		for (const w of walls) {
			for (const e of [w.a, w.b]) {
				if (exclude && dist(e, exclude) < 0.1) continue
				const d = dist(e, p)
				if (d < bestD) {
					bestD = d
					best = e
				}
			}
		}
		return best ? { x: best.x, y: best.y } : p
	}

	// удаление стены под точкой
	const eraseAt = (screenX: number, screenY: number) => {
		const svg = svgRef.current
		if (!svg) return
		const hit = document.elementFromPoint(screenX, screenY)
		const target = hit?.closest('[data-wall]') as Element | null
		if (!target) return
		const data = JSON.parse(target.getAttribute('data-wall')!) as Wall
		const w = walls.find(
			x =>
				dist(x.a, data.a) < 0.1 &&
				dist(x.b, data.b) < 0.1 &&
				x.type === data.type,
		)
		if (w) onDeleteWall(w)
	}

	// Полная отмена текущих жестов (нужно при переходе к pinch)
	const cancelActiveGestures = () => {
		setDrag(null)
		setDragDevice(null)
		setPan(null)
		erasing.current = false
	}

	const handlePointerDown = (e: React.PointerEvent<SVGSVGElement>) => {
		// 0. Регистрируем указатель
		pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY })

		if (pointers.current.size === 2) {
			const [p1, p2] = [...pointers.current.values()]
			const cx = (p1.x + p2.x) / 2
			const cy = (p1.y + p2.y) / 2
			const d = Math.hypot(p1.x - p2.x, p1.y - p2.y)
			pinch.current = {
				dist: d,
				center: toWorld({ clientX: cx, clientY: cy }),
				view: { ...view },
			}
			twoFingerPan.current = {
				x: cx,
				y: cy,
				view: { ...view },
			}
			// Отменяем начатое рисование одним пальцем
			cancelActiveGestures()
			return
		}

		// Если уже идёт pinch - игнорируем нажатия
		if (pinch.current) return

		// 1. Проверяем, кликнули ли мы на устройство
		const deviceNode = (e.target as Element).closest('[data-device-id]')
		if (deviceNode && (e.button === 0 || e.pointerType === 'touch')) {
			const id = deviceNode.getAttribute('data-device-id')!
			const dev = devices.find(d => d.id === id)
			if (dev) {
				const worldP = toWorld(e)
				setDragDevice({
					id,
					offset: {
						x: worldP.x - dev.position.x,
						y: worldP.y - dev.position.y,
					},
					sx: e.clientX,
					sy: e.clientY,
				})
				svgRef.current!.setPointerCapture(e.pointerId)
				return
			}
		}

		// 2. Панорамирование
		if (e.button === 1) {
			e.preventDefault()
			setPan({ x: e.clientX, y: e.clientY, view: { ...view } })
			svgRef.current!.setPointerCapture(e.pointerId)
			return
		}

		// 3. Ластик
		if (tool === 'eraser') {
			if (e.button !== 0 && e.pointerType !== 'touch') return
			erasing.current = true
			eraseAt(e.clientX, e.clientY)
			svgRef.current!.setPointerCapture(e.pointerId)
			return
		}

		// 4. Рисование стен/дверей
		if (e.button !== 0 && e.pointerType !== 'touch') return
		// Не рисуем дверь/стену, если tool некорректный
		if (tool !== 'wall' && tool !== 'door') return

		const p = snapPoint(toWorld(e), gridSize)
		const start = snapToEndpoint(p)
		setDrag({ start, current: start, sx: e.clientX, sy: e.clientY })
		svgRef.current!.setPointerCapture(e.pointerId)
	}

	const handlePointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
		// Обновляем позицию указателя
		if (pointers.current.has(e.pointerId)) {
			pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY })
		}

		// Pinch + двухпальцевое панорамирование
		if (pinch.current && pointers.current.size === 2) {
			const [p1, p2] = [...pointers.current.values()]
			const d = Math.hypot(p1.x - p2.x, p1.y - p2.y)
			const cx = (p1.x + p2.x) / 2
			const cy = (p1.y + p2.y) / 2

			if (pinch.current.dist > 0 && d > 0) {
				const factor = pinch.current.dist / d
				const nw = Math.min(20000, Math.max(200, pinch.current.view.w * factor))
				const realFactor = nw / pinch.current.view.w
				const c = pinch.current.center

				// Зум вокруг центра между пальцами
				let x = c.x - (c.x - pinch.current.view.x) * realFactor
				let y = c.y - (c.y - pinch.current.view.y) * realFactor

				// Добавляем смещение от движения центра (панорамирование двумя пальцами)
				const scale = nw / (svgRef.current!.clientWidth || 1)
				if (twoFingerPan.current) {
					x -= (cx - twoFingerPan.current.x) * scale
					y -= (cy - twoFingerPan.current.y) * scale
				}

				setView({
					x,
					y,
					w: nw,
					h: pinch.current.view.h * realFactor,
				})
			}
			return
		}

		// Ластик (протяжка)
		if (erasing.current) {
			eraseAt(e.clientX, e.clientY)
			return
		}

		// Перетаскивание устройства
		if (dragDevice) {
			const p = toWorld(e)
			onDeviceMove(dragDevice.id, {
				x: p.x - dragDevice.offset.x,
				y: p.y - dragDevice.offset.y,
			})
			return
		}

		// Панорамирование (только СКМ)
		if (pan) {
			const scale = view.w / (svgRef.current!.clientWidth || 1)
			setView({
				...view,
				x: pan.view.x - (e.clientX - pan.x) * scale,
				y: pan.view.y - (e.clientY - pan.y) * scale,
			})
			return
		}

		// Рисование стен
		if (!drag) return
		let p = snapPoint(toWorld(e), gridSize)
		p = snapToEndpoint(p, 14, drag.start)
		if (e.shiftKey) p = constrainOrtho(drag.start, p)
		setDrag({ ...drag, current: p })
	}

	const handlePointerUp = (e: React.PointerEvent<SVGSVGElement>) => {
		pointers.current.delete(e.pointerId)

		// Завершаем pinch при поднятии одного из двух пальцев
		if (pinch.current && pointers.current.size < 2) {
			pinch.current = null
			twoFingerPan.current = null
			return
		}

		// Ластик
		if (erasing.current) {
			erasing.current = false
			return
		}

		// Отпускание устройства
		if (dragDevice) {
			// Вычисляем, было ли это перетаскиванием или просто кликом
			const moved =
				Math.hypot(e.clientX - dragDevice.sx, e.clientY - dragDevice.sy) > 4

			if (!moved) {
				// Если не двигали — это клик, открываем меню
				const dev = devices.find(d => d.id === dragDevice.id)
				if (dev) {
					onDeviceClick(dev, e.clientX, e.clientY)
				}
			}
			setDragDevice(null)
			return
		}

		// Панорамирование
		if (pan) {
			setPan(null)
			return
		}

		// Окончание рисования стены
		if (!drag) return
		const { start, current, sx, sy } = drag
		const moved = Math.hypot(e.clientX - sx, e.clientY - sy) > 4
		setDrag(null)
		if (moved && dist(start, current) > 2) {
			if (tool === 'wall' || tool === 'door') {
				onAddWall(start, current, tool)
			}
		}
	}

	// Отмена pinch при pointercancel
	const handlePointerCancel = (e: React.PointerEvent<SVGSVGElement>) => {
		pointers.current.delete(e.pointerId)
		if (pointers.current.size < 2) {
			pinch.current = null
			twoFingerPan.current = null
		}
		erasing.current = false
	}

	const handleContextMenu = (e: React.MouseEvent<SVGSVGElement>) => {
		e.preventDefault()
		// Удаление стены правой кнопкой (игнорируем клики по устройствам)
		if ((e.target as Element).closest('[data-device-id]')) return

		const target = (e.target as Element).closest('[data-wall]')
		if (!target) return

		const data = JSON.parse(target.getAttribute('data-wall')!) as Wall
		const w = walls.find(
			x =>
				dist(x.a, data.a) < 0.1 &&
				dist(x.b, data.b) < 0.1 &&
				x.type === data.type,
		)
		if (w) onDeleteWall(w)
	}

	// СКМ (Zoom)
	useEffect(() => {
		const svg = svgRef.current
		if (!svg) return
		const onWheel = (e: WheelEvent) => {
			e.preventDefault()
			const p = toWorld(e)
			const factor = e.deltaY < 0 ? 0.9 : 1.1
			const nw = Math.min(20000, Math.max(200, view.w * factor))
			const realFactor = nw / view.w
			setView({
				x: p.x - (p.x - view.x) * realFactor,
				y: p.y - (p.y - view.y) * realFactor,
				w: nw,
				h: view.h * realFactor,
			})
		}
		svg.addEventListener('wheel', onWheel, { passive: false })
		return () => svg.removeEventListener('wheel', onWheel)
	}, [view, setView])

	// Escape (Отмена действий)
	useEffect(() => {
		const onKey = (e: KeyboardEvent) => {
			if (e.key === 'Escape') {
				setDrag(null)
				setDragDevice(null)
			}
		}
		document.addEventListener('keydown', onKey)
		return () => document.removeEventListener('keydown', onKey)
	}, [])

	const promptRoom = rooms.find(r => r.key === promptRoomKey)
	const promptCentroid = promptRoom ? centroid(promptRoom.polygon) : null

	const isGrabbing = !!dragDevice || !!pan

	return (
		<svg
			ref={svgRef}
			viewBox={`${view.x} ${view.y} ${view.w} ${view.h}`}
			className={`${styles.svg} ${isGrabbing ? styles.grabbing : ''}`}
			onPointerDown={handlePointerDown}
			onPointerMove={handlePointerMove}
			onPointerUp={handlePointerUp}
			onPointerCancel={handlePointerCancel}
			onContextMenu={handleContextMenu}
			style={{ touchAction: 'none' }}
		>
			<defs>
				<pattern
					id='grid'
					width={gridSize}
					height={gridSize}
					patternUnits='userSpaceOnUse'
				>
					<path
						d={`M ${gridSize} 0 L 0 0 0 ${gridSize}`}
						fill='none'
						stroke='#e3e3e3'
						strokeWidth={1}
					/>
				</pattern>
			</defs>
			<rect
				x={-100000}
				y={-100000}
				width={200000}
				height={200000}
				fill='url(#grid)'
			/>

			{/* rooms */}
			<g>
				{rooms.map(room => {
					const pts = room.polygon.map((p: any) => `${p.x},${p.y}`).join(' ')
					const c = centroid(room.polygon)
					return (
						<g key={room.key}>
							<polygon points={pts} className={styles.roomPolygon} />
							{room.name && (
								<>
									<text
										x={c.x}
										y={c.y}
										fontSize={13 * zoom}
										className={styles.roomName}
										onDoubleClick={() =>
											onRenameRoom(room.key, room.name ?? '')
										}
									>
										{room.name}
									</text>
									<text
										x={c.x}
										y={c.y + 14 * zoom}
										className={styles.roomArea}
										fontSize={10 * zoom}
									>
										{(room.area / (gridSize * gridSize)).toFixed(1)} кл²
									</text>
								</>
							)}
						</g>
					)
				})}
			</g>

			{/* walls */}
			<g>
				{walls.map((w, i) =>
					w.type === 'door' ? (
						<Door key={i} wall={w} />
					) : (
						<line
							key={i}
							x1={w.a.x}
							y1={w.a.y}
							x2={w.b.x}
							y2={w.b.y}
							className={styles.wall}
							strokeWidth={thickness}
							data-wall={JSON.stringify(w)}
						/>
					),
				)}
				{walls.map((w, i) =>
					[w.a, w.b].map((e, j) => (
						<circle
							key={`${i}-${j}`}
							cx={e.x}
							cy={e.y}
							r={3 * zoom}
							className={styles.wallNode}
						/>
					)),
				)}
			</g>

			{/* devices */}
			<g>
				{devices.map(dev => {
					let color = '#9e9e9e' // По умолчанию серый
					if (dev.type.includes('socket')) color = '#ff9800' // Оранжевый для розеток
					if (dev.type.includes('light')) color = '#2196f3' // Синий для лампочек

					return (
						<g
							key={dev.id}
							transform={`translate(${dev.position.x}, ${dev.position.y})`}
						>
							{/* Тень для объема */}
							<circle
								cx={2 * zoom}
								cy={2 * zoom}
								r={10 * zoom}
								className={styles.deviceShadow}
							/>
							{/* Сам кружок */}
							<circle
								cx={0}
								cy={0}
								r={10 * zoom}
								fill={color}
								className={styles.deviceCircle}
								strokeWidth={2 * zoom}
								data-device-id={dev.id}
							/>
							{/* Буква внутри */}
							<text
								x={0}
								y={4 * zoom}
								fontSize={10 * zoom}
								className={styles.deviceLetter}
							>
								{dev.name.charAt(0).toUpperCase()}
							</text>
						</g>
					)
				})}
			</g>

			{/* preview */}
			<g>
				{drag && (
					<PreviewLine
						a={drag.start}
						b={drag.current}
						tool={tool}
						thickness={thickness}
					/>
				)}
			</g>

			{/* name prompt */}
			{promptRoom && promptCentroid && (
				<foreignObject
					x={promptCentroid.x - 90 * zoom}
					y={promptCentroid.y - 16 * zoom}
					width={180 * zoom}
					height={34 * zoom}
				>
					<input
						autoFocus
						placeholder='Название комнаты…'
						style={{
							fontSize: 13 * zoom,
						}}
						className={styles.promptInput}
						onKeyDown={e => {
							if (e.key === 'Enter') {
								const v =
									(e.target as HTMLInputElement).value.trim() || 'Комната'
								onRenameRoom(promptRoom.key, v)
								onPromptDone()
							} else if (e.key === 'Escape') {
								onRenameRoom(promptRoom.key, 'Комната')
								onPromptDone()
							}
						}}
						onBlur={onPromptDone}
					/>
				</foreignObject>
			)}
		</svg>
	)
}

function Door({ wall }: { wall: Wall }) {
	const len = dist(wall.a, wall.b)
	const ang = Math.atan2(wall.b.y - wall.a.y, wall.b.x - wall.a.x)
	const hinge = wall.a
	const perpAng = ang - Math.PI / 2
	const tip = {
		x: wall.a.x + len * Math.cos(ang),
		y: wall.a.y + len * Math.sin(ang),
	}
	const leafEnd = {
		x: hinge.x + len * Math.cos(perpAng),
		y: hinge.y + len * Math.sin(perpAng),
	}
	const sweep = ang < 0 || ang > Math.PI ? 0 : 1

	return (
		<g data-wall={JSON.stringify(wall)}>
			<line
				x1={wall.a.x}
				y1={wall.a.y}
				x2={wall.b.x}
				y2={wall.b.y}
				strokeWidth={2}
				className={styles.doorDashed}
			/>
			<path
				d={`M ${tip.x} ${tip.y} A ${len} ${len} 0 0 ${sweep} ${leafEnd.x} ${leafEnd.y}`}
				strokeWidth={1}
				className={styles.doorSwing}
			/>
			<line
				x1={hinge.x}
				y1={hinge.y}
				x2={leafEnd.x}
				y2={leafEnd.y}
				strokeWidth={2}
				className={styles.doorLine}
			/>
			<circle cx={hinge.x} cy={hinge.y} r={2.5} className={styles.doorHinge} />
		</g>
	)
}

function PreviewLine({
	a,
	b,
	tool,
	thickness,
}: {
	a: Point
	b: Point
	tool: Tool
	thickness: number
}) {
	if (tool === 'door') {
		return (
			<g opacity={0.6}>
				<Door wall={{ a, b, type: 'door' }} />
			</g>
		)
	}
	return (
		<line
			x1={a.x}
			y1={a.y}
			x2={b.x}
			y2={b.y}
			strokeWidth={thickness}
			className={styles.previewLine}
		/>
	)
}

export default Canvas

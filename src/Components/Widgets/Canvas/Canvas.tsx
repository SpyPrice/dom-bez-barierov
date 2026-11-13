import { useEffect, useRef, useState } from 'react'
import {
	centroid,
	constrainOrtho,
	dist,
	snapPoint,
} from '../../Pages/MapEditor/geometry'
import type {
	PlacedDevice,
	Point,
	Room,
	Tool,
	ViewBox,
	Wall,
} from '../../Pages/MapEditor/types'

interface Props {
	walls: Wall[]
	rooms: Room[]
	tool: Tool
	gridSize: number
	thickness: number
	view: ViewBox
	setView: (v: ViewBox) => void
	onAddWall: (a: Point, b: Point, type: Tool) => void
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

	const handlePointerDown = (e: React.PointerEvent<SVGSVGElement>) => {
		// 1. Проверяем, кликнули ли мы на устройство
		const deviceNode = (e.target as Element).closest('[data-device-id]')
		if (deviceNode && e.button === 0) {
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

		// 2. Панорамирование (средняя кнопка)
		if (e.button === 1) {
			e.preventDefault()
			setPan({ x: e.clientX, y: e.clientY, view: { ...view } })
			svgRef.current!.setPointerCapture(e.pointerId)
			return
		}

		// 3. Рисование стен/дверей (левая кнопка)
		if (e.button !== 0) return
		const p = snapPoint(toWorld(e), gridSize)
		const start = snapToEndpoint(p)
		setDrag({ start, current: start, sx: e.clientX, sy: e.clientY })
		svgRef.current!.setPointerCapture(e.pointerId)
	}

	const handlePointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
		// Перетаскивание устройства
		if (dragDevice) {
			const p = toWorld(e)
			onDeviceMove(dragDevice.id, {
				x: p.x - dragDevice.offset.x,
				y: p.y - dragDevice.offset.y,
			})
			return
		}

		// Панорамирование
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
			onAddWall(start, current, tool)
		}
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

	// Wheel listener (Zoom)
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

	return (
		<svg
			ref={svgRef}
			viewBox={`${view.x} ${view.y} ${view.w} ${view.h}`}
			style={{
				flex: 1,
				background: '#fafafa',
				touchAction: 'none',
				cursor: dragDevice ? 'grabbing' : pan ? 'grabbing' : 'crosshair',
				userSelect: 'none',
			}}
			onPointerDown={handlePointerDown}
			onPointerMove={handlePointerMove}
			onPointerUp={handlePointerUp}
			onContextMenu={handleContextMenu}
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
							<polygon
								points={pts}
								fill='rgba(42,119,85,0.08)'
								pointerEvents='none'
							/>
							{room.name && (
								<>
									<text
										x={c.x}
										y={c.y}
										fill='#2a7'
										textAnchor='middle'
										fontSize={13 * zoom}
										pointerEvents='none'
										onDoubleClick={() =>
											onRenameRoom(room.key, room.name ?? '')
										}
									>
										{room.name}
									</text>
									<text
										x={c.x}
										y={c.y + 14 * zoom}
										fill='#888'
										textAnchor='middle'
										fontSize={10 * zoom}
										pointerEvents='none'
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
							stroke='#222'
							strokeLinecap='square'
							strokeWidth={thickness}
							pointerEvents='stroke'
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
							fill='#2a7'
							pointerEvents='none'
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
								fill='rgba(0,0,0,0.2)'
								pointerEvents='none'
							/>
							{/* Сам кружок */}
							<circle
								cx={0}
								cy={0}
								r={10 * zoom}
								fill={color}
								stroke='#fff'
								strokeWidth={2 * zoom}
								data-device-id={dev.id}
								style={{ cursor: 'pointer' }}
							/>
							{/* Буква внутри */}
							<text
								x={0}
								y={4 * zoom}
								textAnchor='middle'
								fill='#fff'
								fontSize={10 * zoom}
								fontWeight='bold'
								pointerEvents='none'
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
							width: '100%',
							height: '100%',
							padding: 6,
							border: '2px solid #2a7',
							borderRadius: 6,
							fontSize: 13 * zoom,
							outline: 'none',
							boxShadow: '0 2px 8px rgba(0,0,0,.1)',
						}}
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
				stroke='#222'
				strokeWidth={2}
				strokeDasharray='4 4'
				pointerEvents='stroke'
			/>
			<path
				d={`M ${tip.x} ${tip.y} A ${len} ${len} 0 0 ${sweep} ${leafEnd.x} ${leafEnd.y}`}
				fill='none'
				stroke='#999'
				strokeWidth={1}
				pointerEvents='none'
			/>
			<line
				x1={hinge.x}
				y1={hinge.y}
				x2={leafEnd.x}
				y2={leafEnd.y}
				stroke='#222'
				strokeWidth={2}
				pointerEvents='none'
			/>
			<circle
				cx={hinge.x}
				cy={hinge.y}
				r={2.5}
				fill='#222'
				pointerEvents='none'
			/>
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
			stroke='#2a7'
			strokeWidth={thickness}
			strokeLinecap='square'
			opacity={0.55}
			pointerEvents='none'
		/>
	)
}

export default Canvas

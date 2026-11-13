import { yandexApi } from '@/Api/yandexApi'
import Canvas from '@/Components/Widgets/Canvas'
import DeviceMenu from '@/Components/Widgets/DeviceMenu'
import Panel from '@/Components/Widgets/Panel'
import { useCallback, useEffect, useRef, useState } from 'react'
import { addWallToState, rebuildRooms } from './geometry'
import type {
	Device,
	DevicesResponse,
	PlacedDevice,
	Point,
	Room,
	Tool,
	ViewBox,
	Wall,
} from './types'
import { useHistory } from './useHistory'

interface MapEditorProps {
	className?: string
	children?: React.ReactNode
	onClick?: () => void
}

export const MapEditor = ({}: MapEditorProps) => {
	const { walls, setWalls, commit, undo, redo, reset } = useHistory([])
	const [rooms, setRooms] = useState<Room[]>([])
	const [gridSize, setGridSize] = useState(20)
	const [thickness, setThickness] = useState(8)
	const [tool, setTool] = useState<Tool>('wall')
	const [view, setView] = useState<ViewBox>({ x: 0, y: 0, w: 1200, h: 800 })
	const [promptRoomKey, setPromptRoomKey] = useState<string | null>(null)

	const [apiData, setApiData] = useState<DevicesResponse | null>(null)
	const [placedDevices, setPlacedDevices] = useState<PlacedDevice[]>([])
	const [selectedDevice, setSelectedDevice] = useState<{
		device: PlacedDevice
		x: number
		y: number
	} | null>(null)

	const prevRoomsRef = useRef<Room[]>([])

	const getDevices = async () => {
		const data: any = await yandexApi.userInfo()
		setApiData(data)
	}

	useEffect(() => {
		getDevices()
	}, [])
	console.log(apiData)

	// Recompute rooms when walls change
	useEffect(() => {
		const next = rebuildRooms(walls, prevRoomsRef.current)
		prevRoomsRef.current = next
		setRooms(next)

		const fresh = next.find(r => r.name === null)
		if (fresh) setPromptRoomKey(fresh.key)
	}, [walls])

	const handleAddWall = useCallback(
		(a: Point, b: Point, type: Tool) => {
			const next = addWallToState(walls, a, b, type)
			if (next !== walls) commit(next)
		},
		[walls, commit],
	)

	const handleDeleteWall = useCallback(
		(w: Wall) => {
			commit(walls.filter(x => x !== w))
		},
		[walls, commit],
	)

	const handleRenameRoom = useCallback((key: string, name: string) => {
		setRooms(prev => prev.map(r => (r.key === key ? { ...r, name } : r)))
		prevRoomsRef.current = prevRoomsRef.current.map(r =>
			r.key === key ? { ...r, name } : r,
		)
	}, [])

	const handleUndo = () => {
		undo()
	}
	const handleRedo = () => {
		redo()
	}

	const handleClear = () => {
		if (!walls.length) return
		commit([])
	}

	const resetView = useCallback(() => {
		if (!walls.length) {
			setView({ x: 0, y: 0, w: 1200, h: 800 })
			return
		}
		let minX = Infinity,
			minY = Infinity,
			maxX = -Infinity,
			maxY = -Infinity
		for (const w of walls) {
			for (const p of [w.a, w.b]) {
				minX = Math.min(minX, p.x)
				maxX = Math.max(maxX, p.x)
				minY = Math.min(minY, p.y)
				maxY = Math.max(maxY, p.y)
			}
		}
		const pad = 60
		minX -= pad
		minY -= pad
		maxX += pad
		maxY += pad
		const w = maxX - minX
		const h = maxY - minY
		const ratio = window.innerWidth / window.innerHeight
		if (w / h > ratio) {
			const nh = w / ratio
			setView({ x: minX, y: minY - (nh - h) / 2, w, h: nh })
		} else {
			const nw = h * ratio
			setView({ x: minX - (nw - w) / 2, y: minY, w: nw, h })
		}
	}, [walls])

	// keyboard shortcuts
	useEffect(() => {
		const onKey = (e: KeyboardEvent) => {
			if (
				(e.ctrlKey || e.metaKey) &&
				e.key.toLowerCase() === 'z' &&
				!e.shiftKey
			) {
				e.preventDefault()
				undo()
			}
			if (
				(e.ctrlKey || e.metaKey) &&
				(e.key.toLowerCase() === 'y' ||
					(e.shiftKey && e.key.toLowerCase() === 'z'))
			) {
				e.preventDefault()
				redo()
			}
		}
		document.addEventListener('keydown', onKey)
		return () => document.removeEventListener('keydown', onKey)
	}, [undo, redo])

	const exportJson = () => {
		const data = {
			gridSize,
			thickness,
			walls,
			rooms: rooms.map(r => ({
				name: r.name,
				area: r.area,
				polygon: r.polygon,
			})),
		}
		download(
			'apartment.json',
			JSON.stringify(data, null, 2),
			'application/json',
		)
	}

	const exportSvg = () => {
		const svg = document.querySelector('svg')
		if (!svg) return
		const clone = svg.cloneNode(true) as SVGSVGElement
		clone.querySelectorAll('[data-wall]').forEach(n => {})
		const xml = new XMLSerializer().serializeToString(clone)
		download(
			'apartment.svg',
			`<?xml version="1.0" encoding="UTF-8"?>\n${xml}`,
			'image/svg+xml',
		)
	}

	// on resize fit view
	useEffect(() => {
		const onResize = () => resetView()
		window.addEventListener('resize', onResize)
		return () => window.removeEventListener('resize', onResize)
	}, [resetView])

	// --- ЛОГИКА УСТРОЙСТВ ---

	// Добавление устройства на карту (в центр экрана)
	const handleAddDevice = (device: Device) => {
		setPlacedDevices(prev => [
			...prev,
			{
				...device,
				position: { x: view.x + view.w / 2, y: view.y + view.h / 2 },
			},
		])
	}

	// Перемещение устройства
	const handleDeviceMove = (id: string, pos: Point) => {
		setPlacedDevices(prev =>
			prev.map(d => (d.id === id ? { ...d, position: pos } : d)),
		)
	}

	// Клик по устройству (открытие меню)
	const handleDeviceClick = (device: PlacedDevice, x: number, y: number) => {
		setSelectedDevice({ device, x, y })
	}

	// Переключение состояния (Имитация отправки на бэкенд)
	const handleToggleDevice = (id: string) => {
		setPlacedDevices(prev =>
			prev.map(d => {
				if (d.id !== id) return d

				const newCapabilities = d.capabilities.map(cap => {
					if (cap.type === 'devices.capabilities.on_off') {
						return {
							...cap,
							state: cap.state
								? { ...cap.state, value: !cap.state.value }
								: null,
						}
					}
					return cap
				})

				return { ...d, capabilities: newCapabilities }
			}),
		)

		// Обновляем меню, если оно открыто
		if (selectedDevice && selectedDevice.device.id === id) {
			const updatedDev = placedDevices.find(d => d.id === id)
			if (updatedDev) {
				setSelectedDevice({
					...selectedDevice,
					device: { ...updatedDev, capabilities: updatedDev.capabilities },
				})
			}
		}
	}

	// Устройства, которые еще не добавлены на карту
	const availableDevices =
		apiData?.devices.filter(d => !placedDevices.some(pd => pd.id === d.id)) ||
		[]

	return (
		<div
			style={{
				display: 'flex',
				height: '100vh',
				fontFamily: 'system-ui, sans-serif',
			}}
		>
			<Canvas
				walls={walls}
				rooms={rooms}
				tool={tool}
				gridSize={gridSize}
				thickness={thickness}
				view={view}
				setView={setView}
				onAddWall={handleAddWall}
				onDeleteWall={handleDeleteWall}
				onRenameRoom={handleRenameRoom}
				promptRoomKey={promptRoomKey}
				onPromptDone={() => setPromptRoomKey(null)}
				onZoom={() => {}}
				devices={placedDevices}
				onDeviceMove={handleDeviceMove}
				onDeviceClick={handleDeviceClick}
			/>
			<Panel
				tool={tool}
				setTool={setTool}
				gridSize={gridSize}
				setGridSize={setGridSize}
				thickness={thickness}
				setThickness={setThickness}
				onUndo={handleUndo}
				onRedo={handleRedo}
				onResetView={resetView}
				onClear={handleClear}
				onExportSvg={exportSvg}
				onExportJson={exportJson}
				rooms={rooms}
				onRenameRoom={handleRenameRoom}
				availableDevices={availableDevices}
				onAddDevice={handleAddDevice}
			/>

			{/* Всплывающее меню устройства */}
			{selectedDevice && apiData && (
				<DeviceMenu
					device={placedDevices.find(d => d.id === selectedDevice.device.id)!} // Берем актуальное состояние
					rooms={apiData.rooms}
					x={selectedDevice.x}
					y={selectedDevice.y}
					onClose={() => setSelectedDevice(null)}
					onToggle={handleToggleDevice}
				/>
			)}
		</div>
	)
}

function download(name: string, content: string, type: string) {
	const blob = new Blob([content], { type })
	const a = document.createElement('a')
	a.href = URL.createObjectURL(blob)
	a.download = name
	a.click()
	setTimeout(() => URL.revokeObjectURL(a.href), 1000)
}

export default MapEditor

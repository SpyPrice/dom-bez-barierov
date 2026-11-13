import type { Device } from '@/Api/yandexApi'
import type { Room, Tool } from '../../Pages/MapEditor/types'
import RoomList from '../RoomList/RoomList'

interface Props {
	tool: Tool
	setTool: (t: Tool) => void
	gridSize: number
	setGridSize: (n: number) => void
	thickness: number
	setThickness: (n: number) => void
	onUndo: () => void
	onRedo: () => void
	onResetView: () => void
	onClear: () => void
	onExportSvg: () => void
	onExportJson: () => void
	rooms: Room[]
	onRenameRoom: (key: string, name: string) => void
	availableDevices: Device[] // Устройства, которых еще нет на карте
	onAddDevice: (device: Device) => void
}

export const Panel = (p: Props) => {
	return (
		<div
			style={{
				width: 240,
				padding: 14,
				borderLeft: '1px solid #e0e0e0',
				background: '#fff',
				overflowY: 'auto',
			}}
		>
			<h3 style={{ margin: '0 0 10px', fontSize: 15 }}>Инструмент</h3>
			<div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
				<ToolBtn active={p.tool === 'wall'} onClick={() => p.setTool('wall')}>
					Стена
				</ToolBtn>
				{/* <ToolBtn active={p.tool === 'door'} onClick={() => p.setTool('door')}>
					Дверь
				</ToolBtn> */}
			</div>

			<label style={labelStyle}>
				Размер сетки: <span>{p.gridSize}</span> px
			</label>
			<input
				type='range'
				min={5}
				max={50}
				step={5}
				value={p.gridSize}
				onChange={e => p.setGridSize(+e.target.value)}
				style={{ width: '100%' }}
			/>

			<label style={labelStyle}>
				Толщина стен: <span>{p.thickness}</span> px
			</label>
			<input
				type='range'
				min={2}
				max={20}
				value={p.thickness}
				onChange={e => p.setThickness(+e.target.value)}
				style={{ width: '100%' }}
			/>

			<button style={btnStyle} onClick={p.onUndo}>
				Отменить
			</button>
			<button style={btnStyle} onClick={p.onRedo}>
				Повторить
			</button>
			<button style={btnStyle} onClick={p.onResetView}>
				Вписать в экран
			</button>
			<button style={btnStyle} onClick={p.onClear}>
				Очистить всё
			</button>

			<h3 style={{ margin: '16px 0 10px', fontSize: 15 }}>Устройства API</h3>
			<div
				style={{
					display: 'flex',
					flexDirection: 'column',
					gap: '6px',
					marginBottom: '20px',
				}}
			>
				{p.availableDevices.length === 0 && (
					<span style={{ fontSize: 12, color: '#888' }}>
						Все устройства добавлены
					</span>
				)}
				{p.availableDevices.map(dev => (
					<button
						key={dev.id}
						onClick={() => p.onAddDevice(dev)}
						style={{
							padding: '8px',
							textAlign: 'left',
							background: '#fff',
							border: '1px solid #ccc',
							borderRadius: '4px',
							cursor: 'pointer',
						}}
					>
						<div style={{ fontWeight: 'bold', fontSize: '12px' }}>
							{dev.name}
						</div>
						<div style={{ fontSize: '10px', color: '#888' }}>
							{dev.type.replace('devices.types.', '')}
						</div>
					</button>
				))}
			</div>

			<h3 style={{ margin: '16px 0 10px', fontSize: 15 }}>Комнаты</h3>
			<div style={{ fontSize: 13, marginTop: 8 }}>
				<RoomList
					rooms={p.rooms}
					gridSize={p.gridSize}
					onRename={p.onRenameRoom}
				/>
			</div>
		</div>
	)
}

const labelStyle: React.CSSProperties = {
	display: 'block',
	fontSize: 13,
	margin: '10px 0 4px',
	color: '#444',
}

const btnStyle: React.CSSProperties = {
	width: '100%',
	padding: 8,
	margin: '4px 0',
	border: '1px solid #ccc',
	background: '#f6f6f6',
	borderRadius: 6,
	cursor: 'pointer',
	fontSize: 13,
}

function ToolBtn({
	active,
	onClick,
	children,
}: {
	active: boolean
	onClick: () => void
	children: React.ReactNode
}) {
	return (
		<button
			onClick={onClick}
			style={{
				flex: 1,
				padding: 8,
				border: '1px solid ' + (active ? '#2a7' : '#ccc'),
				borderRadius: 6,
				background: active ? '#2a7' : '#fff',
				color: active ? '#fff' : '#000',
				cursor: 'pointer',
				fontSize: 13,
			}}
		>
			{children}
		</button>
	)
}

export default Panel

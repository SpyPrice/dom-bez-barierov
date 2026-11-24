import type { Device } from '@/Api/yandexApi'
import RoomList from '@Components/UI/RoomList/RoomList'
import type { Room, Tool } from '@Types/mapEditorTypes'
import styles from './Panel.module.scss'

interface Props {
	tool: Tool
	setTool: (t: Tool) => void
	onUndo: () => void
	onRedo: () => void
	onResetView: () => void
	onClear: () => void
	rooms: Room[]
	onRenameRoom: (key: string, name: string) => void
	availableDevices: Device[]
	onAddDevice: (device: Device) => void
}

export const Panel = (p: Props) => {
	return (
		<div className={styles.panel}>
			<h3 className={styles.sectionTitle}>Инструмент</h3>
			<div className={styles.toolGroup}>
				<ToolBtn active={p.tool === 'wall'} onClick={() => p.setTool('wall')}>
					Стена
				</ToolBtn>
				{/* <ToolBtn active={p.tool === 'door'} onClick={() => p.setTool('door')}>
					Дверь
				</ToolBtn> */}
			</div>

			<button className={styles.btn} onClick={p.onUndo}>
				Отменить
			</button>
			<button className={styles.btn} onClick={p.onRedo}>
				Повторить
			</button>
			<button className={styles.btn} onClick={p.onResetView}>
				Вписать в экран
			</button>
			<button className={styles.btn} onClick={p.onClear}>
				Очистить всё
			</button>

			<h3 className={styles.sectionTitle}>Устройства API</h3>
			<div className={styles.devicesList}>
				{p.availableDevices.length === 0 && (
					<span className={styles.noDevices}>Все устройства добавлены</span>
				)}
				{p.availableDevices.map(dev => (
					<button
						key={dev.id}
						onClick={() => p.onAddDevice(dev)}
						className={styles.deviceBtn}
					>
						<div className={styles.deviceName}>{dev.name}</div>
					</button>
				))}
			</div>

			<h3 className={styles.sectionTitle}>Комнаты</h3>
			<div className={styles.roomsWrapper}>
				<RoomList rooms={p.rooms} gridSize={20} onRename={p.onRenameRoom} />
			</div>
		</div>
	)
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
			className={`${styles.toolBtn} ${active ? styles.active : ''}`}
		>
			{children}
		</button>
	)
}

export default Panel

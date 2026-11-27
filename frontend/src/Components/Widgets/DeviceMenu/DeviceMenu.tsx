import { yandexApi } from '@/Api/yandexApi'
import type { ApiRoom, PlacedDevice } from '@Types/mapEditorTypes'
import {
	getDeviceName,
	getDeviceRoom,
	getDeviceTelemetry,
	hasControls,
	isDeviceOn,
} from '@Utils/deviceHelpers'
import styles from './DeviceMenu.module.scss'

interface Props {
	device: PlacedDevice
	rooms: ApiRoom[]
	x: number
	y: number
	onClose: () => void
	onToggle: (id: string) => void
}

export const DeviceMenu = ({
	device,
	rooms,
	x,
	y,
	onClose,
	onToggle,
}: Props) => {
	const isOn = isDeviceOn(device)
	const telemetry = getDeviceTelemetry(device)
	const canControl = hasControls(device)

	const setCapability = async () => {
		if (!device.capabilities || device.capabilities.length === 0) return
		yandexApi.setCapability(
			device.id,
			device.capabilities[0].type,
			device.capabilities[0].state?.instance,
			!isOn,
		)
	}

	return (
		<>
			{/* Невидимый оверлей для закрытия меню по клику вне его */}
			<div className={styles.overlay} onClick={onClose} />

			<div className={styles.menu} style={{ left: x, top: y }}>
				<div className={styles.header}>
					<div>
						<div className={styles.name}>{getDeviceName(device)}</div>
						<div className={styles.room}>{getDeviceRoom(device, rooms)}</div>
					</div>

					{canControl && isOn !== null && (
						<button
							onClick={() => {
								onToggle(device.id)
								setCapability()
							}}
							className={`${styles.toggleBtn} ${isOn ? styles.on : ''}`}
						>
							{isOn ? 'ВКЛ' : 'ВЫКЛ'}
						</button>
					)}
				</div>

				{telemetry.length > 0 && (
					<div className={styles.telemetry}>
						{telemetry.map((t, i) => (
							<div key={i} className={styles.telemetryRow}>
								<span className={styles.telemetryLabel}>{t.label}</span>
								<span className={styles.telemetryValue}>{t.value}</span>
							</div>
						))}
					</div>
				)}
			</div>
		</>
	)
}

export default DeviceMenu

import { yandexApi } from '@/Api/yandexApi'
import {
	getDeviceName,
	getDeviceRoom,
	getDeviceTelemetry,
	getDeviceTypeLabel,
	hasControls,
	isDeviceOn,
} from '../../../Utils/MapUtils'
import type { ApiRoom, PlacedDevice } from '../../Pages/MapEditor/types'

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

	const setCapability = async () => {
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
			<div
				style={{ position: 'fixed', inset: 0, zIndex: 10 }}
				onClick={onClose}
			/>

			<div
				style={{
					position: 'absolute',
					left: x,
					top: y,
					transform: 'translate(-50%, -110%)', // Позиционируем над точкой
					background: '#fff',
					border: '1px solid #ccc',
					borderRadius: '8px',
					padding: '12px',
					boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
					zIndex: 20,
					minWidth: '200px',
					fontFamily: 'system-ui, sans-serif',
				}}
			>
				<div
					style={{
						display: 'flex',
						justifyContent: 'space-between',
						alignItems: 'flex-start',
					}}
				>
					<div>
						<div style={{ fontWeight: 'bold', fontSize: '14px' }}>
							{getDeviceName(device)}
						</div>
						<div style={{ fontSize: '12px', color: '#888' }}>
							{getDeviceTypeLabel(device)}
						</div>
						<div style={{ fontSize: '11px', color: '#aaa' }}>
							{getDeviceRoom(device, rooms)}
						</div>
					</div>

					{hasControls(device) && (
						<button
							onClick={() => {
								onToggle(device.id)
								setCapability()
							}}
							style={{
								background: isOn ? '#2a7' : '#eee',
								color: isOn ? '#fff' : '#333',
								border: 'none',
								padding: '6px 10px',
								borderRadius: '4px',
								cursor: 'pointer',
								fontWeight: 'bold',
								fontSize: '12px',
							}}
						>
							{isOn ? 'ON' : 'OFF'}
						</button>
					)}
				</div>

				{telemetry.length > 0 && (
					<div
						style={{
							marginTop: '10px',
							borderTop: '1px solid #eee',
							paddingTop: '8px',
						}}
					>
						{telemetry.map((t, i) => (
							<div
								key={i}
								style={{
									display: 'flex',
									justifyContent: 'space-between',
									fontSize: '12px',
									marginBottom: '4px',
								}}
							>
								<span style={{ color: '#666' }}>{t.label}</span>
								<span style={{ fontWeight: '500' }}>{t.value}</span>
							</div>
						))}
					</div>
				)}
			</div>
		</>
	)
}

export default DeviceMenu

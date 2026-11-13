import type { Room } from '../../Pages/MapEditor/types'

interface Props {
	rooms: Room[]
	gridSize: number
	onRename: (key: string, name: string) => void
}

export const RoomList = ({ rooms, gridSize, onRename }: Props) => {
	if (!rooms.length) {
		return (
			<em style={{ color: '#999', fontSize: 12 }}>
				Замкните контур стен, чтобы появилась комната
			</em>
		)
	}
	return (
		<>
			{rooms.map(room => (
				<div
					key={room.key}
					style={{
						padding: '4px 0',
						borderBottom: '1px solid #f0f0f0',
						display: 'flex',
						justifyContent: 'space-between',
						gap: 6,
						alignItems: 'center',
					}}
				>
					<input
						value={room.name ?? ''}
						placeholder='Без названия'
						onChange={e => onRename(room.key, e.target.value)}
						style={{
							flex: 1,
							border: '1px solid #ddd',
							borderRadius: 4,
							padding: '2px 4px',
							fontSize: 12,
							width: '100%',
						}}
					/>
					<span style={{ color: '#888', fontSize: 11, whiteSpace: 'nowrap' }}>
						{(room.area / (gridSize * gridSize)).toFixed(1)} кл²
					</span>
				</div>
			))}
		</>
	)
}

export default RoomList

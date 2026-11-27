import { formatArea } from '@/Utils/units'
import type { Room } from '@Types/mapEditorTypes'
import styles from './RoomList.module.scss'

interface Props {
	rooms: Room[]
	gridSize: number
	onRename: (key: string, name: string) => void
}

export const RoomList = ({ rooms, gridSize, onRename }: Props) => {
	if (!rooms.length) {
		return (
			<em className={styles.empty}>
				Замкните контур стен, чтобы появилась комната
			</em>
		)
	}
	return (
		<>
			{rooms.map(room => (
				<div key={room.key} className={styles.row}>
					<input
						value={room.name ?? ''}
						placeholder='Без названия'
						onChange={e => onRename(room.key, e.target.value)}
						className={styles.input}
					/>
					<span className={styles.area}>{formatArea(room.area)}</span>
				</div>
			))}
		</>
	)
}

export default RoomList

import { useAuth } from '@/Contexts/AuthContext'
import { useState, type Dispatch, type SetStateAction } from 'react'
import styles from './DebugPanel.module.scss'

interface DebugPanelProps {
	setDebugDevices: Dispatch<SetStateAction<Record<string, boolean>>>
	debugDevices: Record<string, boolean>
}
export const DebugPanel = ({
	setDebugDevices,
	debugDevices,
}: DebugPanelProps) => {
	const [isOpen, setIsOpen] = useState(false)

	const { logout, user } = useAuth()

	return (
		<>
			{isOpen ? (
				<div className={styles.debugPanel}>
					<button onClick={logout}>Выйти из аккаунта</button>

					<div className={styles.devices}>
						<p>Дополнительные устройства</p>
						<div className={styles.device}>
							<label htmlFor='tempDevice'>Датчик температуры</label>
							<input
								type='checkbox'
								id='tempDevice'
								onClick={e =>
									setDebugDevices({
										...debugDevices,
										debugTemp: e.currentTarget.checked,
									})
								}
							/>
						</div>
					</div>

					<button onClick={() => setIsOpen(false)}>Закрыть панель</button>
				</div>
			) : (
				<div className={styles.debugPanel}>
					<button onClick={() => setIsOpen(true)}>Debug панель</button>
				</div>
			)}
		</>
	)
}

export default DebugPanel

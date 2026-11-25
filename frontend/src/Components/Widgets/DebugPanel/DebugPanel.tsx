import { useAuth } from '@/Contexts/AuthContext'

interface DebugPanelProps {
	className?: string
	children?: React.ReactNode
	onClick?: () => void
}

export const DebugPanel = () => {
	const { logout, user } = useAuth()
	console.log(user)

	return (
		<div>
			<button onClick={logout}>Выйти</button>
		</div>
	)
}

export default DebugPanel

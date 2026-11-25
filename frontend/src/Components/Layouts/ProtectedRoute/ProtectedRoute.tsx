import { useAuth } from '@/Contexts/AuthContext'
import { Navigate } from 'react-router-dom'

interface ProtectedRouteProps {
	children?: React.ReactNode
}

export const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
	const { isAuthenticated, isLoading } = useAuth()

	if (isLoading) {
		return <div>Загрузка...</div>
	}

	if (!isAuthenticated) {
		return <Navigate to='/login' replace />
	}

	return <>{children}</>
}

export default ProtectedRoute

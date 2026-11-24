import { yandexApi, type UserRead } from '@/Api/yandexApi'
import { createContext, useContext, useEffect, useState } from 'react'
import { toast } from 'react-toastify'

interface AuthContextType {
	user: UserRead | null
	isLoading: boolean
	isAuthenticated: boolean
	login: (email: string, password: string) => Promise<void>
	logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider = ({ children }: { children: any }) => {
	const [user, setUser] = useState<UserRead | null>(null)
	const [isLoading, setIsLoading] = useState(true)

	useEffect(() => {
		checkAuth()
	}, [])

	const checkAuth = async () => {
		const token = localStorage.getItem('access_token')
		if (token) {
			try {
				const userData: any = await yandexApi.getMe()
				setUser(userData)
			} catch (error) {
				localStorage.removeItem('access_token')
				console.error('Auth check failed:', error)
			}
		}
		setIsLoading(false)
	}

	const login = async (email: string, password: string) => {
		try {
			const response: any = await yandexApi.login(email, password)

			localStorage.setItem('access_token', response.access_token)

			const userData: any = await yandexApi.getMe()
			setUser(userData)

			toast.success('Успешный вход!')
		} catch (error: any) {
			if (error.toJSON().message === 'Network Error') return
			toast.error(
				error.response?.data?.detail || 'Неправильный логин или пароль!',
			)
			throw error
		}
	}

	const logout = () => {
		localStorage.removeItem('access_token')
		setUser(null)
		toast.info('Вы вышли из системы!')
	}

	return (
		<AuthContext.Provider
			value={{
				user,
				isLoading,
				isAuthenticated: !!user,
				login,
				logout,
			}}
		>
			{children}
		</AuthContext.Provider>
	)
}

export const useAuth = () => {
	const context = useContext(AuthContext)

	if (!context) {
		throw new Error('useAuth must be used within AuthProvider')
	}
	return context
}

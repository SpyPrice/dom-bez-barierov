import { yandexApi, type UserRead } from '@/Api/yandexApi'
import { createContext, useContext, useEffect, useState } from 'react'
import { toast } from 'react-toastify'

interface AuthContextType {
	user: UserRead | null
	isLoading: boolean
	isAuthenticated: boolean
	loginWithYandex: () => void
	setUserAfterLogin: (user: UserRead) => void
	logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider = ({ children }: { children: any }) => {
	const [user, setUser] = useState<UserRead | null>(null)
	const [isLoading, setIsLoading] = useState(true)

	useEffect(() => {
		const checkAuth = async () => {
			const token = localStorage.getItem('access_token')
			if (token) {
				try {
					const userData = await yandexApi.getMe()
					setUser(userData)
				} catch (error) {
					localStorage.removeItem('access_token')
					console.error('Auth check failed:', error)
				}
			}
			setIsLoading(false)
		}

		checkAuth()
	}, [])

	const loginWithYandex = () => {
		const url = yandexApi.getYandexAuthUrl()
		window.location.href = url
	}

	const setUserAfterLogin = (userData: UserRead) => {
		setUser(userData)
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
				loginWithYandex,
				setUserAfterLogin,
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

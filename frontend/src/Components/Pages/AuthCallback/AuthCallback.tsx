import { yandexApi } from '@/Api/yandexApi'
import { useAuth } from '@/Contexts/AuthContext'
import { useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { toast } from 'react-toastify'

export const AuthCallback = () => {
	const [searchParams] = useSearchParams()
	const navigate = useNavigate()
	const { setUserAfterLogin } = useAuth()
	const code = searchParams.get('code')

	useEffect(() => {
		const handleAuth = async () => {
			if (!code) {
				toast.error('Код авторизации не найден')
				navigate('/login')
				return
			}

			try {
				const response: any = await yandexApi.loginWithYandex(code)

				localStorage.setItem('access_token', response.access_token)

				const userData = await yandexApi.getMe()

				setUserAfterLogin(userData)

				toast.success('Успешный вход!')
				navigate('/')
			} catch (error: any) {
				console.error(error)
				toast.error(
					error.response?.data?.detail || 'Ошибка при авторизации через Яндекс',
				)
				navigate('/login')
			}
		}

		handleAuth()
	}, [code, navigate, setUserAfterLogin])

	return (
		<div
			style={{
				display: 'flex',
				justifyContent: 'center',
				alignItems: 'center',
				height: '100vh',
			}}
		>
			<h2>Авторизация...</h2>
		</div>
	)
}

export default AuthCallback

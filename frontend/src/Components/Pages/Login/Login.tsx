import { useAuth } from '@/Contexts/AuthContext'
import styles from './Login.module.scss'

export const Login = () => {
	const { loginWithYandex } = useAuth()

	return (
		<div className={styles.loginPage}>
			<div className='login-page__card'>
				<h1 className='login-page__title'>Мнемосхема дома</h1>
				<p className='login-page__subtitle'>
					Войдите, чтобы управлять устройствами
				</p>
				<button
					className='login-page__btn'
					onClick={loginWithYandex}
					type='button'
				>
					<span className='login-page__btn-logo' aria-hidden='true'>
						Я
					</span>
					Войти через Яндекс
				</button>
			</div>
		</div>
	)
}

export default Login

import LogoIcon from '@/Assets/Logo.svg?react'
import YaIDIcon from '@/Assets/YaID.svg?react'
import { useAuth } from '@/Contexts/AuthContext'
import styles from './Login.module.scss'

export const Login = () => {
	const { loginWithYandex } = useAuth()

	return (
		<div className={styles.loginPage}>
			<div className={styles.card}>
				<LogoIcon className={styles.logo} />
				<p className={styles.title}>Войти в свой дом без барьеров через</p>

				<YaIDIcon className={styles.loginButton} onClick={loginWithYandex} />
			</div>
		</div>
	)
}

export default Login

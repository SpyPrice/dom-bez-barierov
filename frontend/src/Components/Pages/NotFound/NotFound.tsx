import { Link } from 'react-router-dom'
import styles from './NotFound.module.scss'

export const NotFound = () => {
	return (
		<div className={`${styles.container}`}>
			<h1>404</h1>
			<Link to={'/'}>На главную</Link>
		</div>
	)
}

export default NotFound

import { Outlet } from 'react-router-dom'
import styles from './GeneralLayout.module.scss'

export const GeneralLayout = () => {
	return (
		<>
			<div className={styles.background}>
				<Outlet />
			</div>
		</>
	)
}

export default GeneralLayout

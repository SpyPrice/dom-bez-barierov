import styles from './HouseSpinner.module.scss'

interface HouseSpinnerProps {
	size?: number
	className?: string
}

export const HouseSpinner = ({ size = 120, className }: HouseSpinnerProps) => {
	return (
		<svg
			className={`${styles.houseSpinner} ${className}`.trim()}
			width={size}
			height={size}
			viewBox='0 0 210 210'
			fill='none'
			xmlns='http://www.w3.org/2000/svg'
			role='status'
			aria-label='Загрузка'
		>
			<rect
				className={styles.houseSpinner__bg}
				width='210'
				height='210'
				rx='50'
				fill='#C3CABB'
			/>
			<path
				className={styles.houseSpinner__house}
				d='M105 136.89V170.625H170.625V74.1642L105 39.375L39.375 74.1642V170.625H68.0785M105 109.48V97.884'
				strokeWidth='18'
				strokeLinecap='round'
				strokeLinejoin='round'
				stroke='#475C2D'
				strokeOpacity='0.75'
			/>
		</svg>
	)
}

export default HouseSpinner

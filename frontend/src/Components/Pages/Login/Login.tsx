import styles from './Login.module.scss'

interface LoginProps {
  className?: string
  children?: React.ReactNode
  onClick?: () => void
}

export const Login = ({ 
  className, 
  children, 
  onClick, 
}: LoginProps) => {
  return (
    <div 
      className={`${styles.container} ${className || ''}`}
      onClick={onClick}
    >
      {children || <h1>Login Component</h1>}
    </div>
  )
}

export default Login

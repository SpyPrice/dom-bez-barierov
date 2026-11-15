import './YandexLogin.scss';

interface Props {
    onLogin: () => void;
}

export function LoginPage({ onLogin }: Props) {
    return (
        <div className='login-page'>
            <div className='login-page__card'>
                <h1 className='login-page__title'>Мнемосхема дома</h1>
                <button
                    className='login-page__btn'
                    onClick={onLogin}
                    type='button'
                >
					<span className='login-page__btn-logo' aria-hidden='true'>
						Я
					</span>
                    Войти через Яндекс
                </button>
            </div>
        </div>
    );
}
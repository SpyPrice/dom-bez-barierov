import MapEditor from '@/Components/Pages/MapEditor';
import { LoginPage } from '@/Components/Pages/YandexLogin/YandexLogin';
import { useYandexAuth } from '@/Components/Pages/YandexLogin/useYandexAuth';
import '@Styles/global.scss';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';

function App() {
	const { user, login, logout } = useYandexAuth();

	return (
		<>
			{!user ? (
				<LoginPage onLogin={login} />
			) : (
				<BrowserRouter>
					<header className='app-header'>
						<div className='app-header__user'>
							<span className='app-header__name'>
								{user.display_name || user.login}
							</span>
							<button
								className='app-header__logout'
								onClick={logout}
								type='button'
							>
								Выйти
							</button>
						</div>
					</header>

					<Routes>
						<Route path='/' element={<MapEditor />} />
					</Routes>
				</BrowserRouter>
			)}

			<ToastContainer position='bottom-right' autoClose={3000} />
		</>
	);
}

export default App;
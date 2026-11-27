import GeneralLayout from '@/Components/Layouts/GeneralLayout'
import ProtectedRoute from '@/Components/Layouts/ProtectedRoute'
import AuthCallback from '@/Components/Pages/AuthCallback'
import Login from '@/Components/Pages/Login'
import MapEditor from '@/Components/Pages/MapEditor'
import NotFound from '@/Components/Pages/NotFound'
import { AuthProvider } from '@/Contexts/AuthContext'
import '@Styles/global.scss'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { ToastContainer } from 'react-toastify'

function App() {
	return (
		<>
			<BrowserRouter>
				<AuthProvider>
					<Routes>
						<Route element={<GeneralLayout />}>
							<Route path='/login' element={<Login />} />
							<Route path='*' element={<NotFound />} />

							<Route
								path='/'
								element={
									<ProtectedRoute>
										<MapEditor />
									</ProtectedRoute>
								}
							/>
							<Route path='/map' element={<MapEditor />} />
						</Route>
						<Route path='/auth/callback' element={<AuthCallback />} />
					</Routes>
				</AuthProvider>
			</BrowserRouter>
			<ToastContainer position='bottom-right' autoClose={3000} />
		</>
	)
}

export default App

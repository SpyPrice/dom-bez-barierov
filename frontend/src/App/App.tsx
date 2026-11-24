import MapEditor from '@/Components/Pages/MapEditor'
import NotFound from '@/Components/Pages/NotFound'
import '@Styles/global.scss'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { ToastContainer } from 'react-toastify'

function App() {
	return (
		<>
			<BrowserRouter>
				<Routes>
					<Route path='/' element={<MapEditor />} />
					<Route path='*' element={<NotFound />} />
				</Routes>
			</BrowserRouter>
			<ToastContainer position='bottom-right' autoClose={3000} />
		</>
	)
}

export default App

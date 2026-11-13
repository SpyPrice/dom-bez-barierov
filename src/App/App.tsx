import MapEditor from '@/Components/Pages/MapEditor'
import '@Styles/global.scss'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { ToastContainer } from 'react-toastify'

function App() {
	return (
		<>
			<BrowserRouter>
				<Routes>
					<Route path='/' element={<MapEditor />} />
				</Routes>
			</BrowserRouter>
			<ToastContainer position='bottom-right' autoClose={3000} />
		</>
	)
}

export default App

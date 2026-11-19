import axios from 'axios'
import { toast } from 'react-toastify'

const api = axios.create({
	baseURL: import.meta.env.VITE_SERVER_URL || 'http://localhost:8000',
	timeout: 10000,
	headers: {
		'Content-Type': 'application/json',
	},
})

api.interceptors.request.use(
	config => {
		const token = import.meta.env.VITE_TOKEN
		if (token) {
			config.headers.Authorization = `Bearer ${token}`
		}
		return config
	},
	error => {
		return Promise.reject(error)
	},
)

api.interceptors.response.use(
	response => response.data,
	error => {
		if (error.toJSON().message === 'Network Error') {
			toast.error('Нет соединения с прокси-сервером! Попробуйе позже')
		}
		if (error.response?.status === 401) {
			localStorage.removeItem('access_token')
			window.location.href = '/login'
		}
		return Promise.reject(error)
	},
)

export default api

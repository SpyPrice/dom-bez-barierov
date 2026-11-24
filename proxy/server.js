require('dotenv').config()
const express = require('express')
const cors = require('cors')
const { createProxyMiddleware } = require('http-proxy-middleware')
const axios = require('axios')

const app = express()
const PORT = process.env.PROXY_PORT || 8000

app.use(
	cors({
		origin: process.env.ALLOWED_ORIGIN || 'http://localhost:3000',
		credentials: true,
		allowedHeaders: ['Content-Type', 'Authorization'],
		methods: ['GET', 'POST', 'OPTIONS'],
	}),
)

app.use(express.json())

app.get('/health', (req, res) => res.json({ status: 'ok' }))

app.use(
	'/api',
	createProxyMiddleware({
		target: process.env.TARGET_URL || 'http://localhost:3000',
		changeOrigin: true,
		pathRewrite: {
			'^/api': '',
		},
		onError: (err, req, res) => {
			console.error('error:', err.message)
			res.status(502).json({ error: 'API недоступен' })
		},
	}),
)

app.get('/getUser', async (req, res) => {
	const authHeader = req.headers.authorization

	if (!authHeader) {
		return res.status(401).json({ error: 'Токен не предоставлен' })
	}

	const token = authHeader.replace(/^(Bearer|OAuth)\s+/i, '')

	try {
		const response = await fetch('https://login.yandex.ru/info?format=json', {
			method: 'GET',
			headers: {
				Authorization: `OAuth ${token}`,
				'Content-Type': 'application/json',
			},
		})

		if (!response.ok) {
			const errorData = await response.json()
			return res.status(response.status).json(errorData)
		}

		const userData = await response.json()
		res.json(userData)
	} catch (error) {
		console.error('Ошибка при запросе к Яндекс ID:', error)
		res.status(500).json({ error: 'Внутренняя ошибка сервера' })
	}
})

app.post('/auth/yandex', async (req, res) => {
	const { code } = req.body

	try {
		const response = await axios.post(
			'https://oauth.yandex.ru/token',
			new URLSearchParams({
				grant_type: 'authorization_code',
				code: code,
				client_id: process.env.YANDEX_CLIENT_ID,
				client_secret: process.env.YANDEX_CLIENT_SECRET,
			}),
			{ headers: { 'Content-Type': 'application/x-www-form-urlencoded' } },
		)

		const { access_token, expires_in } = response.data

		res.json({ access_token, expires_in })
	} catch (error) {
		console.error('Auth Error:', error.response?.data || error.message)
		res.status(400).json({ detail: 'Ошибка авторизации' })
	}
})

app.listen(PORT, () => {
	console.log(`Сервер работает на localhost:${PORT}`)
})

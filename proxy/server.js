require('dotenv').config()
const express = require('express')
const cors = require('cors')
const { createProxyMiddleware } = require('http-proxy-middleware')

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

app.listen(PORT, () => {
	console.log(`Сервер работает на localhost:${PORT}`)
})

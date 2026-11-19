import babel from '@rolldown/plugin-babel'
import react, { reactCompilerPreset } from '@vitejs/plugin-react'
import path from 'path'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
	plugins: [
		react(),
		babel({ presets: [reactCompilerPreset()] }),
		VitePWA({
			registerType: 'autoUpdate',
			includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'mask-icon.svg'],
			manifest: {
				name: 'Дом без барьеров',
				short_name: 'Карта умного дома',
				description: 'Карта для управления устройствами умного дома',
				theme_color: '#ffffff',
				background_color: '#ffffff',
				display: 'standalone',
				icons: [
					{
						src: 'pwa-192x192.png',
						sizes: '192x192',
						type: 'image/png',
					},
					{
						src: 'pwa-512x512.png',
						sizes: '512x512',
						type: 'image/png',
					},
					{
						src: 'pwa-512x512.png',
						sizes: '512x512',
						type: 'image/png',
						purpose: 'maskable',
					},
				],
				screenshots: [
					{
						src: 'screenshot-desktop.png',
						sizes: '1280x720',
						type: 'image/png',
						form_factor: 'wide',
						label: 'Главный экран',
					},
					{
						src: 'screenshot-mobile.png',
						sizes: '1080x1920',
						type: 'image/png',
						form_factor: 'narrow',
						label: 'Мобильный вид',
					},
				],
			},
		}),
	],
	resolve: {
		alias: {
			'@': path.resolve(__dirname, './src'),
			'@Api': path.resolve(__dirname, './src/Api'),
			'@Components': path.resolve(__dirname, './src/Components'),
			'@Constants': path.resolve(__dirname, './src/Constants'),
			'@Contexts': path.resolve(__dirname, './src/Contexts'),
			'@Hooks': path.resolve(__dirname, './src/Hooks'),
			'@Types': path.resolve(__dirname, './src/Types'),
			'@Models': path.resolve(__dirname, './src/Models'),
			'@Providers': path.resolve(__dirname, './src/Providers'),
			'@Schemas': path.resolve(__dirname, './src/Schemas'),
			'@Styles': path.resolve(__dirname, './src/Styles'),
			'@Utils': path.resolve(__dirname, './src/Utils'),
		},
	},
	css: {
		preprocessorOptions: {
			scss: {
				additionalData: `@use "@Styles/variables.scss" as *;\n`,
			},
		},
	},
})

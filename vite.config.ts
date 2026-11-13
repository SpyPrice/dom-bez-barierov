import babel from '@rolldown/plugin-babel'
import react, { reactCompilerPreset } from '@vitejs/plugin-react'
import path from 'path'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
	plugins: [react(), babel({ presets: [reactCompilerPreset()] })],
	resolve: {
		alias: {
			'@': path.resolve(__dirname, './src'),
			'@Api': path.resolve(__dirname, './src/Api'),
			'@Components': path.resolve(__dirname, './src/Components'),
			'@Constants': path.resolve(__dirname, './src/Constants'),
			'@Contexts': path.resolve(__dirname, './src/Contexts'),
			'@Hooks': path.resolve(__dirname, './src/Hooks'),
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

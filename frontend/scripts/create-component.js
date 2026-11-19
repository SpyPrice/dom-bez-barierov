#!/usr/bin/env node

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Получаем аргументы командной строки
const args = process.argv.slice(2)

if (args.length < 2) {
	console.error('Usage: npm run create-component <path> <ComponentName>')
	console.error('Example: npm run create-component /Components/UI Button')
	console.error(
		'Example: npm run create-component /Components/Widgets PriceChart',
	)
	process.exit(1)
}

let targetPath = args[0]
const componentName = args[1]

// Убираем слеш в начале если есть
if (targetPath.startsWith('/')) {
	targetPath = targetPath.substring(1)
}

// Формируем полный путь
const fullPath = path.join(process.cwd(), 'src', targetPath, componentName)
const relativePath = path.join(targetPath, componentName)

// Создаем папку компонента
if (!fs.existsSync(fullPath)) {
	fs.mkdirSync(fullPath, { recursive: true })
	console.log(`✅ Created directory: ${fullPath}`)
} else {
	console.log(`⚠️ Directory already exists: ${fullPath}`)
}

// Генерация контента для TSX
const getTsxContent = () => {
	return `import styles from './${componentName}.module.scss'

interface ${componentName}Props {
  className?: string
  children?: React.ReactNode
  onClick?: () => void
}

export const ${componentName} = ({ 
  className, 
  children, 
  onClick, 
}: ${componentName}Props) => {
  return (
    <div 
      className={\`\${styles.container} \${className || ''}\`}
      onClick={onClick}
    >
      {children || <h1>${componentName} Component</h1>}
    </div>
  )
}

export default ${componentName}
`
}

// Генерация контента для SCSS
const getScssContent = () => {
	return `.container {
  // Add your styles here
}
`
}

// Записываем файлы
fs.writeFileSync(path.join(fullPath, `${componentName}.tsx`), getTsxContent())
console.log(`✅ Created: ${relativePath}/${componentName}.tsx`)

fs.writeFileSync(
	path.join(fullPath, `${componentName}.module.scss`),
	getScssContent(),
)
console.log(`✅ Created: ${relativePath}/${componentName}.module.scss`)

fs.writeFileSync(
	path.join(fullPath, `index.ts`),
	`export { ${componentName} } from './${componentName}'
export { default } from './${componentName}'
`,
)
console.log(`✅ Created: ${relativePath}/index.ts`)

console.log(
	`\n🎉 Component ${componentName} created successfully at ${relativePath}/`,
)
console.log(`\n🔧 Next steps:`)
console.log(
	`  1. Import component: import { ${componentName} } from '@/${targetPath}/${componentName}'`,
)
console.log(`  2. Start using your component!`)

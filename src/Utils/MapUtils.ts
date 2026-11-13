import type {
	ApiRoom,
	Capability,
	Device,
} from '@Components/Pages/MapEditor/types'

/**
 * От сюда можно брать методы для получения всей инфы,
 * если чего то нет то сказать мне м я это добавлю
 * Сейчас там функционал сделан только под розетку(как тестовый прибор)
 * Везде указаны описания для каждого метода, некоторые методы возвращают
 * строки которые в теории придется изменить, если что менять их лучше здесь
 * а не брать отсюда и менять дальше
 */

// 1. ИМЕНА И СТАТУСЫ

/**
 * Возвращает имя устройства
 */
export function getDeviceName(device: Device): string {
	return device.name
}

/**
 * Возвращает красивое человекочитаемое название типа устройства
 */
export function getDeviceTypeLabel(device: Device): string {
	const labels: Record<string, string> = {
		'devices.types.socket': 'Умная розетка',
		'devices.types.light': 'Умная лампа',
		'devices.types.smart_speaker.yandex.station.micro': 'Яндекс Станция Лайт',
	}
	// Если тип неизвестен просто убираем техническую приставку
	return labels[device.type] || device.type.replace('devices.types.', '')
}

/**
 * Находит название комнаты, в которой стоит устройство.
 */
export function getDeviceRoom(device: Device, rooms: ApiRoom[]): string {
	if (!device.room) return 'Без комнаты'
	const room = rooms.find(r => r.id === device.room)
	return room ? room.name : 'Комната не найдена'
}

/**
 * Возвращает общий статус устройства текстом.
 */
export function getDeviceStatus(device: Device): string {
	const isOn = isDeviceOn(device)
	if (isOn === null) {
		return 'Нет данных'
	}
	return isOn ? 'Включено' : 'Выключено'
}

/**
 * Проверяет, включено ли устройство прямо сейчас
 */
export function isDeviceOn(device: Device): boolean | null {
	const cap = device.capabilities.find(
		c => c.type === 'devices.capabilities.on_off',
	)
	if (cap?.state?.value !== undefined) {
		return Boolean(cap.state.value)
	}
	return null
}

// 2. УПРАВЛЕНИЕ

/**
 * Проверяет, можно ли вообще управлять конкретным умением
 */
export function isCapabilityEditable(capability: Capability): boolean {
	return capability.state !== null && capability.state.value !== undefined
}

/**
 * Возвращает умений, которые можно менять
 */
export function getEditableCapabilities(device: Device): Capability[] {
	return device.capabilities.filter(isCapabilityEditable)
}

/**
 * Проверяет, есть ли у устройства хотя бы одна управляемая кнопка
 * Если у устройства нет управляемых функций (как у Алисы)
 */
export function hasControls(device: Device): boolean {
	return getEditableCapabilities(device).length > 0
}

// 3. ЦИФРОВЫЕ ПОКАЗАТЕЛИ

export interface TelemetryItem {
	label: string // Красивое название (Мощность)
	value: string // Значение с единицей (67 Вт)
	updatedAt: string // Время обновления (13:56)
}

/**
 * Собирает все показатели устройства (Ватты, Вольты, Амперы и т.д.) в массив.
 */
export function getDeviceTelemetry(device: Device): TelemetryItem[] {
	return device.properties
		.filter(p => p.state !== null && p.state.value !== undefined)
		.map(p => ({
			label: getPropertyLabel(p.parameters.instance),
			value: `${p.state?.value} ${formatUnit(p.parameters.unit)}`,
			updatedAt: formatTime(p.last_updated),
		}))
}

// 4. ВНУТРЕННИЕ ФУНКЦИИ

/**
 * Внутренняя функция: переводит системные названия свойств в русские
 * PS пока только для розетки но дальше больше
 */
function getPropertyLabel(instance: string): string {
	const labels: Record<string, string> = {
		power: 'Мощность',
		voltage: 'Напряжение',
		amperage: 'Сила тока',
	}
	return labels[instance] || instance
}

/**
 * Внутренняя функция: переводит системные единицы измерения в красивые символы.
 */
function formatUnit(unit?: string): string {
	if (unit === 'unit.watt') return 'Вт'
	if (unit === 'unit.volt') return 'В'
	if (unit === 'unit.ampere') return 'А'
	return unit || ''
}

/**
 * Внутренняя функция: превращает Unix-время в обычные часы и минуты.
 */
function formatTime(timestamp: number): string {
	if (!timestamp) {
		return 'никогда'
	}
	return new Date(timestamp * 1000).toLocaleTimeString('ru-RU', {
		hour: '2-digit',
		minute: '2-digit',
	})
}

import api from './axios'

export interface DevicesResponse {
	status: string
	request_id: string
	devices: Device[]
	rooms: Room[]
	households: Household[]
}

export interface Device {
	id: string
	name: string
	aliases: string[]
	type: string
	external_id: string
	skill_id: string
	household_id: string
	room: string | null
	groups: string[]
	capabilities: Capability[]
	properties: Property[]
	device_info?: {
		manufacturer?: string
		model?: string
	}
}

export interface Capability {
	type: string
	retrievable: boolean
	reportable: boolean
	parameters: {
		instance: string
		range?: { min: number; max: number; precision: number }
		modes?: { value: string; name: string }[]
		[key: string]: any
	}
	state: {
		instance: string
		value: any // boolean для on_off, number для range, string для mode
	} | null
}

export interface Property {
	type: string
	reportable: boolean
	retrievable: boolean
	parameters: {
		instance: string // power, voltage, amperage
		unit?: string
		range?: any
		events?: any
	}
	state: {
		instance: string
		value: any
	} | null
	last_updated: number
}

export interface Room {
	id: string
	name: string
	aliases: string[] | null
	household_id: string
	devices: string[]
}

export interface Household {
	id: string
	name: string
	aliases: string[]
	type: string
}

export interface UserRead {
	id: string
	client_id: string
	login: string
	display_name: string
	first_name: string
	last_name: string
	real_name: string
	sex: string
	psuid: string
}

export const yandexApi = {
	getYandexAuthUrl: () => {
		const clientId = import.meta.env.VITE_YANDEX_CLIENT_ID
		const redirectUri = encodeURIComponent(import.meta.env.VITE_REDIRECT_URI)
		return `https://oauth.yandex.ru/authorize?response_type=code&client_id=${clientId}&redirect_uri=${redirectUri}`
	},

	loginWithYandex: async (code: string) => {
		return api.post('/auth/yandex', { code })
	},

	getMe: async (): Promise<UserRead> => {
		return api.get('/getUser')
	},

	userInfo: () => api.get<DevicesResponse>('/api/v1.0/user/info'),

	setCapability: (
		deviceId: any,
		capabilityType: any,
		instance: any,
		value: any,
	) => {
		api.post<DevicesResponse>('/api/v1.0/devices/actions', {
			devices: [
				{
					id: deviceId,
					actions: [
						{
							type: capabilityType,
							state: {
								instance: instance,
								value: value,
							},
						},
					],
				},
			],
		})
	},
}

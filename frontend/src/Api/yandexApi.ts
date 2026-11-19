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

export const yandexApi = {
	// register: (data: UserCreate) => api.post<TokenWithUser>('/register', data),

	// login: async (username: string, password: string) => {
	// 	const formData = new URLSearchParams()
	// 	formData.append('username', username)
	// 	formData.append('password', password)

	// 	return api.post<Token>('/login', formData, {
	// 		headers: {
	// 			'Content-Type': 'application/x-www-form-urlencoded',
	// 		},
	// 	})
	// },

	userInfo: () => api.get<any>('/api/v1.0/user/info'),

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

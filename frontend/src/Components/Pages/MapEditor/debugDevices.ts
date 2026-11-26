import type { Device } from '@/Types/mapEditorTypes'

export const debugTemp: Device = {
	id: 'test',
	name: 'Датчик температуры',
	type: 'devices.types.sensor.climate',
	aliases: [],
	external_id: 'test',
	groups: [],
	household_id: 'test',
	skill_id: 'test',
	room: 'test',
	capabilities: [],
	properties: [
		{
			type: 'devices.properties.float',
			reportable: true,
			retrievable: true,
			parameters: {
				instance: 'temperature',
				unit: 'unit.temperature.celsius',
			},
			state: {
				instance: 'temperature',
				value: 25,
			},
			last_updated: 1795521298.622,
		},
		{
			type: 'devices.properties.float',
			reportable: true,
			retrievable: true,
			parameters: {
				instance: 'humidity',
				unit: 'unit.percent',
			},
			state: {
				instance: 'humidity',
				value: 21,
			},
			last_updated: 1795521298.622,
		},
	],
	device_info: {
		manufacturer: 'test',
		model: 'test',
	},
}

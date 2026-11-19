export interface Point {
	x: number
	y: number
}

export type WallType = 'wall' | 'door'

export interface Wall {
	a: Point
	b: Point
	type: WallType
}

export interface Room {
	key: string
	polygon: Point[]
	area: number
	name: string | null
}

export type Tool = 'wall' | 'door'

export interface ViewBox {
	x: number
	y: number
	w: number
	h: number
}

export interface GraphNode extends Point {
	edges: GraphEdge[]
}

export interface GraphEdge {
	a: GraphNode
	b: GraphNode
	wall: Wall
}

// ... существующие типы (Point, Wall, Tool, ViewBox, Room)

export interface PlacedDevice extends Device {
	position: Point
}

// ---- ТИПЫ ИЗ API ----
export interface DevicesResponse {
	status: string
	request_id: string
	devices: Device[]
	rooms: ApiRoom[]
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
		value: any
	} | null
}

export interface Property {
	type: string
	reportable: boolean
	retrievable: boolean
	parameters: {
		instance: string
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

export interface ApiRoom {
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

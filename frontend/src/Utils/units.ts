// Сколько world-единиц в 1 метре
export const UNITS_PER_METER = 100
// Сколько world-единиц в 1 клетке сетки
export const GRID_SIZE = 20

export const toMeters = (u: number) => u / UNITS_PER_METER

//  world-ед.² → м²
export const toSquareMeters = (u2: number) => u2 / UNITS_PER_METER ** 2

//  Красивый формат длины: 1.25 м, 80 см
export function formatLength(units: number): string {
	const m = toMeters(units)
	if (m < 1) return `${Math.round(m * 100)} см`
	return `${m.toFixed(2)} м`
}

//  Красивый формат площади: 12.4 м², 0.35 м²
export function formatArea(units2: number): string {
	const m2 = toSquareMeters(units2)
	return `${m2.toFixed(1)} м²`
}

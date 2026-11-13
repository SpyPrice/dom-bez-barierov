import type { GraphEdge, GraphNode, Point, Room, Wall } from './types'

export const dist = (a: Point, b: Point) => Math.hypot(a.x - b.x, a.y - b.y)

export function snapVal(v: number, grid: number) {
	return Math.round(v / grid) * grid
}

export function snapPoint(p: Point, grid: number): Point {
	return { x: snapVal(p.x, grid), y: snapVal(p.y, grid) }
}

export function constrainOrtho(a: Point, b: Point): Point {
	return Math.abs(b.x - a.x) >= Math.abs(b.y - a.y)
		? { x: b.x, y: a.y }
		: { x: a.x, y: b.y }
}

export function segIntersect(
	a: Point,
	b: Point,
	c: Point,
	d: Point,
): Point | null {
	const d1 = (b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x)
	const d2 = (b.x - a.x) * (d.y - a.y) - (b.y - a.y) * (d.x - a.x)
	const d3 = (d.x - c.x) * (a.y - c.y) - (d.y - c.y) * (a.x - c.x)
	const d4 = (d.x - c.x) * (b.y - c.y) - (d.y - c.y) * (b.x - c.x)
	if (
		((d1 > 0 && d2 < 0) || (d1 < 0 && d2 > 0)) &&
		((d3 > 0 && d4 < 0) || (d3 < 0 && d4 > 0))
	) {
		const t = d1 / (d1 - d2)
		return { x: c.x + (d.x - c.x) * t, y: c.y + (d.y - c.y) * t }
	}
	return null
}

export function buildGraph(walls: Wall[]) {
	const nodes: GraphNode[] = []
	const EPS = 1.5
	const nodeAt = (p: Point): GraphNode => {
		for (const n of nodes) if (dist(n, p) < EPS) return n
		const n: GraphNode = { x: p.x, y: p.y, edges: [] }
		nodes.push(n)
		return n
	}
	const edges: GraphEdge[] = []
	for (const w of walls) {
		const a = nodeAt(w.a)
		const b = nodeAt(w.b)
		if (a === b) continue
		const e: GraphEdge = { a, b, wall: w }
		a.edges.push(e)
		b.edges.push(e)
		edges.push(e)
	}
	return { nodes, edges }
}

const otherEnd = (e: GraphEdge, n: GraphNode) => (e.a === n ? e.b : e.a)
const angleTo = (n: Point, m: Point) => Math.atan2(m.y - n.y, m.x - n.x)

export function findFaces(graph: ReturnType<typeof buildGraph>): Point[][] {
	const sorted = new Map<GraphNode, GraphEdge[]>()
	for (const n of graph.nodes) {
		sorted.set(
			n,
			n.edges
				.slice()
				.sort(
					(e1, e2) => angleTo(n, otherEnd(e1, n)) - angleTo(n, otherEnd(e2, n)),
				),
		)
	}
	const visited = new Set<string>()
	const faces: Point[][] = []
	const idx = new Map<GraphNode, number>()
	graph.nodes.forEach((n, i) => idx.set(n, i))

	for (const n of graph.nodes) {
		for (const startEdge of sorted.get(n)!) {
			const k0 = `${idx.get(n)}|${idx.get(otherEnd(startEdge, n))}`
			if (visited.has(k0)) continue
			const face: Point[] = []
			let currNode = n
			let currEdge = startEdge
			let guard = 0
			while (guard++ < 10000) {
				const k = `${idx.get(currNode)}|${idx.get(otherEnd(currEdge, currNode))}`
				if (visited.has(k)) break
				visited.add(k)
				face.push({ x: currNode.x, y: currNode.y })
				const nextNode = otherEnd(currEdge, currNode)
				const neigh = sorted.get(nextNode)!
				const inIdx = neigh.indexOf(currEdge)
				const nextEdge = neigh[(inIdx - 1 + neigh.length) % neigh.length]
				currNode = nextNode
				currEdge = nextEdge
				if (currNode === n && currEdge === startEdge) break
			}
			if (face.length >= 3) faces.push(face)
		}
	}
	return faces
}

export function polygonArea(pts: Point[]): number {
	let s = 0
	for (let i = 0; i < pts.length; i++) {
		const a = pts[i]
		const b = pts[(i + 1) % pts.length]
		s += a.x * b.y - b.x * a.y
	}
	return s / 2
}

export function centroid(pts: Point[]): Point {
	const a = polygonArea(pts)
	let cx = 0
	let cy = 0
	for (let i = 0; i < pts.length; i++) {
		const p = pts[i]
		const q = pts[(i + 1) % pts.length]
		const f = p.x * q.y - q.x * p.y
		cx += (p.x + q.x) * f
		cy += (p.y + q.y) * f
	}
	return { x: cx / (6 * a), y: cy / (6 * a) }
}

export const faceKey = (pts: Point[]) =>
	pts
		.map(p => `${Math.round(p.x)},${Math.round(p.y)}`)
		.sort()
		.join('|')

export function rebuildRooms(walls: Wall[], prevRooms: Room[]): Room[] {
	const graph = buildGraph(walls)
	const faces = findFaces(graph)
	const prevByKey = new Map(prevRooms.map(r => [r.key, r]))
	const next: Room[] = []
	for (const f of faces) {
		const area = polygonArea(f)
		if (area <= 1) continue
		const key = faceKey(f)
		const prev = prevByKey.get(key)
		next.push({ key, polygon: f, area, name: prev?.name ?? null })
	}
	return next
}

export function addWallToState(
	walls: Wall[],
	a: Point,
	b: Point,
	type: 'wall' | 'door',
): Wall[] {
	if (dist(a, b) < 2) return walls

	const cuts: { point: Point; wall: Wall }[] = []
	for (const w of walls) {
		const x = segIntersect(a, b, w.a, w.b)
		if (x) cuts.push({ point: x, wall: w })
	}

	let next = walls.slice()

	for (const c of cuts) {
		const w = c.wall
		const p = c.point
		const i = next.findIndex(x => x === w)
		if (i < 0) continue
		if (dist(w.a, p) < 1 || dist(w.b, p) < 1) continue
		next.splice(
			i,
			1,
			{ a: { ...w.a }, b: { x: p.x, y: p.y }, type: w.type },
			{ a: { x: p.x, y: p.y }, b: { ...w.b }, type: w.type },
		)
	}

	const points = [a, ...cuts.map(c => c.point), b]
	points.sort((p, q) => dist(a, p) - dist(a, q))
	for (let i = 0; i < points.length - 1; i++) {
		const p = points[i]
		const q = points[i + 1]
		if (dist(p, q) > 0.5) {
			next.push({ a: { ...p }, b: { ...q }, type })
		}
	}
	return next
}

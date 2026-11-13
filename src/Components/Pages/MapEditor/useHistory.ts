import { useCallback, useRef, useState } from 'react'
import type { Wall } from './types'

export function useHistory(initial: Wall[]) {
	const [walls, setWalls] = useState<Wall[]>(initial)
	const history = useRef<string[]>([JSON.stringify(initial)])
	const future = useRef<string[]>([])

	const commit = useCallback((next: Wall[]) => {
		history.current.push(JSON.stringify(next))
		future.current = []
		if (history.current.length > 100) history.current.shift()
		setWalls(next)
	}, [])

	const undo = useCallback(() => {
		if (history.current.length < 2) return
		future.current.push(history.current.pop()!)
		setWalls(JSON.parse(history.current[history.current.length - 1]))
	}, [])

	const redo = useCallback(() => {
		if (!future.current.length) return
		const s = future.current.pop()!
		history.current.push(s)
		setWalls(JSON.parse(s))
	}, [])

	const reset = useCallback((next: Wall[]) => {
		history.current = [JSON.stringify(next)]
		future.current = []
		setWalls(next)
	}, [])

	return { walls, setWalls, commit, undo, redo, reset }
}

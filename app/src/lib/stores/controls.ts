import { writable } from 'svelte/store'
import type { Movement } from '$lib/schemas/shot'

export default writable<{
  x: Movement
  y: Movement
  duration: number
}>({ x: 'orbit', y: 'orbit', duration: 1200 })

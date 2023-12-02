import { writable } from 'svelte/store'
import type { Interaction } from '$lib/types'

export const events = writable<Interaction[]>([])

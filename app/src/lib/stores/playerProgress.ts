import { writable } from 'svelte/store'

export const playerProgress = writable({
  current: 0,
  total: 1,
})

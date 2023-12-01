import { writable } from 'svelte/store'

type TrackedEvent = {
  type: string
  event: Event
}
export const events = writable<TrackedEvent[]>([])

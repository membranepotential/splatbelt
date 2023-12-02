import { writable } from 'svelte/store'
import { VIEWER_STATE } from '$lib/types'

type App = {
  VIEWER_STATE: VIEWER_STATE
}
export const app = writable<App>({
  VIEWER_STATE: VIEWER_STATE.FREE,
})

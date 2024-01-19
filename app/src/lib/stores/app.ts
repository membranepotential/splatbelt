import { writable } from 'svelte/store'
import { VIEWER_STATE } from '$lib/types'

type AppState = {
  state: VIEWER_STATE
  shotIdx: number
}

const stateStore = writable<AppState>({
  state: VIEWER_STATE.FREE,
  shotIdx: 0,
})

export default {
  ...stateStore,
  setShotIdx: (shotIdx: number) =>
    stateStore.update((s) => ({ ...s, shotIdx })),
  decrShotIdx: () =>
    stateStore.update((s) => ({ ...s, shotIdx: Math.max(s.shotIdx - 1, 0) })),
  goto: (state: VIEWER_STATE, shotIdx?: number) =>
    stateStore.update((s) => ({
      state,
      shotIdx: shotIdx ?? s.shotIdx,
    })),
}

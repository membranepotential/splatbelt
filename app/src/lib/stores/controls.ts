import { writable } from 'svelte/store'

import { CAMERA_RECORDING_MODE } from '$lib/types'

type ControlKey = 'x' | 'y' | 'centerLock'
export type Controls = {
  x: CAMERA_RECORDING_MODE
  y: CAMERA_RECORDING_MODE
}
export const controls = writable<Controls>({
  x: CAMERA_RECORDING_MODE.PAN,
  y: CAMERA_RECORDING_MODE.DOLLY,
})

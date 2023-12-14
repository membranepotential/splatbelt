import { writable } from 'svelte/store'
import { Movement } from '$lib/types'

type Controls = {
  x: Movement
  y: Movement
  duration: number
  centerLock: boolean
}

export const DefaultMovement = Movement.ORBIT

export default writable<Controls>({
  x: DefaultMovement,
  y: DefaultMovement,
  duration: 1200,
  centerLock: true,
})

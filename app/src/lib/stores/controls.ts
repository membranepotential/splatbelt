import { writable } from 'svelte/store'
import { Movement } from '$lib/types'

type Controls = {
  x: Movement
  y: Movement
  duration: number
  centerLock: boolean
  speedFactor: number
}

export const DefaultMovement = Movement.ORBIT
export const DefaultSpeed = 1

export default writable<Controls>({
  x: DefaultMovement,
  y: DefaultMovement,
  duration: 1200,
  centerLock: true,
  speedFactor: 1,
})

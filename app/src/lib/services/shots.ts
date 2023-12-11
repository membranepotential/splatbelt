import type { Shot } from '$lib/types'
import {
  derived,
  get,
  writable,
  type Readable,
  type Writable,
} from 'svelte/store'
import { controls } from '$lib/stores'
import { toast } from '$lib/notifications/notifications'
import { Vector3 } from 'three'

const id = (function () {
  let counter = 0
  return () => counter++
})()

/* This is already obsolete, will be reimplemented in the Player component */
class ShotsService {
  shots: Writable<Shot[]>
  currentShotIdx: Writable<number>
  currentShot: Readable<Shot>

  constructor() {
    this.currentShotIdx = writable(0)
    this.shots = writable([this.createEmptyShot()])
    this.currentShot = derived(
      [this.shots, this.currentShotIdx],
      ([$shots, $currentShotIdx]) => {
        const activeShot = $shots[$currentShotIdx]
        if (!activeShot) {
          console.error(
            "Warning: Can't get current shot",
            $shots.length,
            $currentShotIdx
          )
        }
        return activeShot
      }
    )
  }

  createEmptyShot() {
    return {
      id: id(),
      events: writable<Event[]>([]),
      initialPosition: {
        target: new Vector3(),
        position: new Vector3(),
        zoom: 4,
      },
      duration: get(controls).duration,
      newCameraPosition: null,
    }
  }

  getShots() {
    return this.shots
  }

  getCurrentShot() {
    return get(this.currentShot)
  }

  getCurrentShotIdx() {
    return this.currentShotIdx
  }

  updateCurrentShot(payload: Partial<Shot>) {
    this.shots.update((shots) => {
      const currentShotIdx = get(this.currentShotIdx)
      const currentShot = shots[currentShotIdx]
      const newShot = {
        ...currentShot,
        ...payload,
      }

      console.log('updating shot at index ', currentShotIdx, newShot)
      shots[currentShotIdx] = newShot
      return shots
    })
  }

  setCurrentShotIdx(idx: number) {
    this.currentShotIdx.set(idx)
  }

  addShotAndSetCurrent() {
    const currentShotCount = get(this.shots).length

    if (currentShotCount > 7) {
      return toast('Maximum number of shots reached')
    }

    const newShot = this.createEmptyShot()

    console.log('new shot', newShot)
    this.shots.update((shots) => [...shots, newShot])
    console.log('shots updated')
    this.currentShotIdx.set(currentShotCount)
  }

  back() {
    if (get(this.currentShotIdx) === 0) {
      return
    }
    this.shots.update((shots) => {
      const newShots = shots.slice(0, shots.length - 1)
      return newShots
    })
    this.currentShotIdx.update((current) => current - 1)
  }
}

export default new ShotsService()

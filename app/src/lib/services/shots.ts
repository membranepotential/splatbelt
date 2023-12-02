import type { Shot } from '$lib/types'
import {
  derived,
  get,
  writable,
  type Readable,
  type Writable,
} from 'svelte/store'
import { toast } from '$lib/notifications/notifications'
import { Vector3 } from 'three'

const id = (function () {
  let counter = 0
  return () => counter++
})()

class ShotsService {
  shots: Writable<Shot[]>
  currentShotIdx: Writable<number>
  currentShot: Readable<Shot>

  constructor() {
    this.currentShotIdx = writable(0)

    this.shots = writable([this.createEmptyShot()])

    this.currentShot = derived(
      [this.shots, this.currentShotIdx],
      ([$shots, $currentShotIdx]) => $shots[$currentShotIdx]
    )

    if (false) {
      this.shots.set([
        {
          trace: [],
          initialPosition: {
            target: new Vector3(),
            position: new Vector3(),
            zoom: 4,
          },
        },
        {
          trace: [],
          initialPosition: {
            target: new Vector3(),
            position: new Vector3(),
            zoom: 4,
          },
        },
        {
          trace: [],
          initialPosition: {
            target: new Vector3(),
            position: new Vector3(),
            zoom: 4,
          },
        },
      ])
      this.currentShot.set(2)
    }
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
    }
  }

  getShotCount() {}

  getShots() {
    return this.shots
  }

  getCurrentShot() {
    return this.currentShot
  }

  getCurrentShotIdx() {
    return this.currentShot
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
}

const shotsService = new ShotsService()

export default shotsService

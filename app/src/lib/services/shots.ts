import type { Shot } from '$lib/types'
import { get, writable, type Writable } from 'svelte/store'
import { toast } from '$lib/notifications/notifications'
import { Vector3 } from 'three'

class ShotsService {
  shots: Writable<Shot[]>

  currentShot: Writable<number>

  constructor() {
    this.currentShot = writable(1)
    this.shots = writable([])

    if (true) {
      this.shots.set([
        {
          events: [{} as Event, {} as Event],
          initialPosition: {
            target: new Vector3(),
            position: new Vector3(),
            zoom: 4,
          },
        },
        {
          events: [{} as Event, {} as Event],
          initialPosition: {
            target: new Vector3(),
            position: new Vector3(),
            zoom: 4,
          },
        },
        {
          events: [{} as Event, {} as Event],
          initialPosition: {
            target: new Vector3(),
            position: new Vector3(),
            zoom: 4,
          },
        },
      ])
    }
  }

  getShotCount() {}

  getShots() {
    return this.shots
  }

  getCurrentShot() {
    return this.currentShot
  }

  setCurrentShot(idx: number) {
    this.currentShot.set(idx)
  }

  addShotAndSetCurrent() {
    const currentShotCount = get(this.shots).length

    if (currentShotCount > 7) {
      return toast('Maximum number of shots reached')
    }

    const newShot = {
      events: [{} as Event, {} as Event],
      initialPosition: {
        target: new Vector3(),
        position: new Vector3(),
        zoom: 4,
      },
    }

    this.shots.update((shots) => [...shots, newShot])
    this.currentShot.set(currentShotCount)
  }
}

const shotsService = new ShotsService()

export default shotsService

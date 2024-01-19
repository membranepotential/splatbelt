import { Vector2, Vector3 } from 'three'
import { writable } from 'svelte/store'
import type { Shot } from '$lib/types'
import type { ShotItem } from '$lib/server/projects'

const store = writable<Shot[]>()

function hydrate(shots: ShotItem[]) {
  store.set(
    shots.map((shot) => {
      const samples = shot.samples.map((sample) => ({
        timeStamp: sample.timeStamp,
        pointer: new Vector2(sample.pointer.x, sample.pointer.y),
        camera: {
          position: new Vector3(
            sample.camera.position.x,
            sample.camera.position.y,
            sample.camera.position.z
          ),
          target: new Vector3(
            sample.camera.target.x,
            sample.camera.target.y,
            sample.camera.target.z
          ),
          zoom: sample.camera.zoom,
        },
      }))

      return { ...shot, samples }
    })
  )
}

function push(shot: Shot) {
  store.update(($shots) => [...$shots, shot])
}

function replace(target: number, shot: Shot) {
  store.update(($shots) => {
    const shots = [...$shots]
    shots[target] = shot
    return shots
  })
}

function swap(a: number, b: number) {
  store.update(($shots) => {
    const shots = [...$shots]
    const tmp = shots[a]
    shots[a] = shots[b]
    shots[b] = tmp
    return shots
  })
}

function delete_(target: number) {
  store.update(($shots) => {
    const shots = [...$shots]
    shots.splice(target, 1)
    return shots
  })
}

export default { ...store, hydrate, push, replace, swap, delete_ }

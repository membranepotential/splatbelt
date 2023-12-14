import { writable, get } from 'svelte/store'
import { Vector2, SplineCurve } from 'three'
import simplify from 'simplify-js'

/*
Store that emits updated curves (an array of Vector2).
The curve is simplified and smoothed.
Points are added with addEvent and addPoint.
The whole shot may be overwritten with setShot.
*/
export default (function (n: number = 20, tolerance: number = 10) {
  const store = writable<Vector2[]>([])
  const { subscribe, set } = store

  let points: Vector2[] = []

  function addPoint(xy: Vector2) {
    points.push(xy)
    if (points.length <= 3) {
      set(points)
    } else {
      set(smooth(n, tolerance))
    }
  }

  function addEvent(event: PointerEvent) {
    addPoint(new Vector2(event.clientX, event.clientY))
  }

  function setShot(shot: Vector2[]) {
    points = shot

    if (points.length <= 3) {
      set(points)
    } else {
      set(smooth(n, tolerance))
    }
  }

  function smooth(n: number, tolerance: number, highQuality: boolean = false) {
    if (points.length <= 3) return points

    const smoothed = simplify(points, tolerance, highQuality).map(
      (p) => new Vector2(p.x, p.y)
    )

    return new SplineCurve(smoothed).getSpacedPoints(n)
  }

  function reset() {
    setShot([])
  }

  return {
    getPoints: () => get(store),
    subscribe,
    addPoint,
    addEvent,
    setShot,
    reset,
  }
})()

import { CatmullRomCurve3, EventDispatcher, Vector2 } from 'three'
import { writable, get, type Readable, derived } from 'svelte/store'
import type { Control } from './control'
import { Movement, type CameraSetting, type Sample } from '$lib/types'
import simplify from 'simplify-js'

type Shot = Sample[]

class Trace implements Readable<Shot> {
  subscribe: Readable<Shot>['subscribe']

  tolerance = 2
  minLength = 50

  private startTime?: number
  private shot = writable<Shot>([])

  constructor() {
    this.subscribe = this.shot.subscribe
  }

  reset() {
    this.startTime = undefined
    this.shot.set([])
  }

  record(pointer: Vector2, camera: CameraSetting): Sample {
    const now = performance.now()
    if (!this.startTime) this.startTime = now

    const timeStamp = now - this.startTime
    const sample = { timeStamp, pointer, camera }
    this.shot.update((shot) => [...shot, sample])

    return sample
  }

  isValid() {
    const shot = get(this.shot)
    const points = shot.map((s) => s.pointer)
    const length = this.getLength(points)
    return points.length > 2 && length > this.minLength
  }

  finalize(): Shot {
    this.shot.update((shot) => {
      const points = shot.map((s) => s.pointer)
      if (points.length <= 2) return shot

      const simplified = simplify(points, this.tolerance, true) as Vector2[]
      if (simplified.length <= 2) return shot

      const arcLengths = this.accumulateLength(simplified)
      const totalLength = arcLengths[arcLengths.length - 1]

      const duration = shot[shot.length - 1].timeStamp
      const positions = new CatmullRomCurve3(shot.map((s) => s.camera.position))
      const targets = new CatmullRomCurve3(shot.map((s) => s.camera.target))
      const zooms = shot.map((s) => s.camera.zoom)

      return simplified.map((pointer, i) => {
        const t = arcLengths[i] / totalLength

        // interpolate time stamps
        const timeStamp = t * duration

        // interpolate camera settings
        const position = positions.getPointAt(t)
        const target = targets.getPointAt(t)
        const zoom = this.interpolLinear(zooms, t)

        return { timeStamp, pointer, camera: { position, target, zoom } }
      })
    })

    return get(this.shot)
  }

  private interpolLinear(values: number[], t: number): number {
    if (t < 1e-6) return values[0]
    if (t >= 1) return values[values.length - 1]

    const w = t * (values.length - 1)
    const i = Math.floor(w)
    const v = w - i
    return values[i] * (1 - v) + values[i + 1] * v
  }

  private accumulateLength(points: Vector2[]): number[] {
    const lengths = [0]
    for (let i = 1; i < points.length; i++) {
      lengths.push(lengths[i - 1] + points[i].distanceTo(points[i - 1]))
    }
    return lengths
  }

  private getLength(points: Vector2[]): number {
    return points.reduce((acc, p, i) => {
      if (i > 0) return acc + p.distanceTo(points[i - 1])
      else return acc
    }, 0)
  }
}

type RecordEvents = { type: 'start' | 'end' } | { type: 'shot'; shot: Shot }

export class Record extends EventDispatcher<RecordEvents> {
  control: Control
  motion: { x: Movement; y: Movement }

  shot = new Trace()
  trace = derived(this.shot, (shot) => shot.map((s) => s.pointer))

  private setting2Function
  private pointerId: number | null = null

  private pointer = new Vector2()
  private delta = new Vector2()

  constructor(control: Control, motion: { x: Movement; y: Movement }) {
    super()
    this.control = control
    this.motion = motion

    this.setting2Function = {
      [Movement.ROTATE]: {
        x: (v: number) => this.control.rotate(v, 0),
        y: (v: number) => this.control.rotate(0, v),
      },
      [Movement.PAN]: {
        x: (v: number) => this.control.pan(v, 0),
        y: (v: number) => this.control.pan(0, v),
      },
      [Movement.DOLLY]: {
        x: (v: number) => this.control.dolly(v),
        y: (v: number) => this.control.dolly(v),
      },
      [Movement.ZOOM]: {
        x: (v: number) => this.control.zoom(v),
        y: (v: number) => this.control.zoom(v),
      },
    }

    this.sample = this.sample.bind(this)
    this.onPointerDown = this.onPointerDown.bind(this)
    this.onPointerMove = this.onPointerMove.bind(this)
    this.onPointerUp = this.onPointerUp.bind(this)
    this.onWheel = this.onWheel.bind(this)
  }

  private controlFunction(left: number, up: number) {
    this.setting2Function[this.motion.x].x(left)
    this.setting2Function[this.motion.y].y(up)
  }

  private isRecording(): boolean {
    return this.pointerId !== null
  }

  private isRecordingPointer(event: PointerEvent): boolean {
    return this.isRecording() && this.pointerId === event.pointerId
  }

  private getPointerFromEvent(event: PointerEvent): Vector2 {
    return new Vector2(event.offsetX, event.offsetY)
  }

  private sample() {
    this.shot.record(this.pointer, this.control.sample())
  }

  onPointerDown(event: PointerEvent) {
    if (this.isRecording()) return

    // Ignore non-primary buttons
    if (event.pointerType === 'mouse' && event.button !== 0) return

    this.pointerId = event.pointerId

    const target = event.target as HTMLElement
    target.setPointerCapture(event.pointerId)
    target.addEventListener('pointermove', this.onPointerMove)
    target.addEventListener('pointerup', this.onPointerUp)

    this.pointer = this.getPointerFromEvent(event)
    this.dispatchEvent({ type: 'start' })

    this.shot.reset()
    this.sample()
    this.control.addEventListener('updated', this.sample)
  }

  onPointerMove(event: PointerEvent) {
    if (!this.isRecordingPointer(event)) return

    const height = (event.target as HTMLElement).clientHeight
    this.delta = this.getPointerFromEvent(event)
      .sub(this.pointer)
      .multiplyScalar(1 / height)
    this.controlFunction(this.delta.x, this.delta.y)

    this.pointer = this.getPointerFromEvent(event)
  }

  onPointerUp(event: PointerEvent) {
    if (!this.isRecordingPointer(event)) return

    const target = event.target as HTMLElement
    target.releasePointerCapture(event.pointerId)
    target.removeEventListener('pointermove', this.onPointerMove)
    target.removeEventListener('pointerup', this.onPointerUp)
    this.control.removeEventListener('updated', this.sample)

    if (this.shot.isValid()) {
      const shot = this.shot.finalize()
      this.dispatchEvent({ type: 'shot', shot })
    }

    this.shot.reset()
    this.pointerId = null
    this.dispatchEvent({ type: 'end' })
  }

  onWheel(event: WheelEvent) {
    event.preventDefault()
  }
}

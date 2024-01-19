import {
  VectorKeyframeTrack,
  NumberKeyframeTrack,
  Vector2,
  InterpolateSmooth,
  Interpolant,
  Vector3,
} from 'three'
import type { Control } from './control'
import { writable, type Readable } from 'svelte/store'
import { tweened } from 'svelte/motion'
import type { Shot } from '$lib/types'

class Ticker implements Readable<number> {
  delay: number

  private tween = tweened(0)
  private sleeper: ReturnType<typeof setTimeout> | null = null
  private running = false

  subscribe: Readable<number>['subscribe']

  constructor(delay: number) {
    this.delay = delay
    this.subscribe = this.tween.subscribe
  }

  private sleep(ms: number) {
    if (this.sleeper) clearTimeout(this.sleeper)
    return new Promise((r) => {
      this.sleeper = setTimeout(r, ms)
    })
  }

  async run(duration: number) {
    await this.tween.set(0, { duration: 0 })
    await this.tween.set(1, { duration })
  }

  async loop(duration: number) {
    while (this.running) {
      await this.run(duration)
      await this.sleep(this.delay)
    }
  }

  start(duration: number) {
    this.running = true
    return this.loop(duration)
  }

  async cancel() {
    this.running = false
    await this.tween.set(0, { duration: 0 })
    if (this.sleeper) clearTimeout(this.sleeper)
  }
}

export class Animated {
  delay = 1000

  control: Control

  private _clock = writable(0)
  private _trace = writable<Vector2[]>([])
  private tracks?: {
    pointer: Interpolant
    position: Interpolant
    target: Interpolant
    zoom: Interpolant
  }
  private duration = 0

  private ticker = new Ticker(this.delay)

  constructor(control: Control) {
    this.control = control

    this.ticker.subscribe((t) => {
      if (!this.tracks) return

      this._clock.set(t)

      const td = t * this.duration

      const pointer = new Vector2().fromArray(this.tracks.pointer.evaluate(td))
      this._trace.update(($trace) =>
        t === 0 ? [pointer] : [...$trace, pointer]
      )

      const position = new Vector3().fromArray(
        this.tracks.position.evaluate(td)
      )
      const target = new Vector3().fromArray(this.tracks.target.evaluate(td))
      const zoom = this.tracks.zoom.evaluate(td)[0]

      this.control.moveTo({ position, target, zoom })
    })
  }

  private getTracks(shot: Shot) {
    const samples = shot.samples
    const times = samples.map((s) => s.timeStamp / shot.speed)
    return {
      pointer: new VectorKeyframeTrack(
        'pointer',
        times,
        samples.map((s) => s.pointer.toArray()).flat(),
        InterpolateSmooth
      ).createInterpolant(),
      position: new VectorKeyframeTrack(
        'position',
        times,
        samples.map((s) => s.camera.position.toArray()).flat(),
        InterpolateSmooth
      ).createInterpolant(),
      target: new VectorKeyframeTrack(
        'target',
        times,
        samples.map((s) => s.camera.target.toArray()).flat(),
        InterpolateSmooth
      ).createInterpolant(),
      zoom: new NumberKeyframeTrack(
        'zoom',
        times,
        samples.map((s) => s.camera.zoom),
        InterpolateSmooth
      ).createInterpolant(),
    }
  }

  private getDuration(shot: Shot) {
    return shot.samples[shot.samples.length - 1].timeStamp / shot.speed
  }

  async setShot(shot: Shot) {
    await this.ticker.cancel()
    this._clock.set(0)
    this._trace.set([])

    this.tracks = this.getTracks(shot)
    this.duration = this.getDuration(shot)
    return this.ticker.start(this.duration)
  }

  async stop() {
    await this.ticker.cancel()
  }

  get trace() {
    return { subscribe: this._trace.subscribe }
  }

  get clock() {
    return { subscribe: this._clock.subscribe }
  }

  async playShots(shots: Shot[]) {
    const tracks = shots.map((shot) => this.getTracks(shot))
    const durations = shots.map(this.getDuration)

    for (let i = 0; i < tracks.length; i++) {
      this.tracks = tracks[i]
      this.duration = durations[i]
      await this.ticker.run(this.duration)
    }
  }
}

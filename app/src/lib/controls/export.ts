import { get } from 'svelte/store'
import type { Animated } from './animated'
import { shots } from '$lib/stores'

export class Export {
  framerate = 30
  animation: Animated

  private canvas: HTMLCanvasElement
  private stream?: MediaStream
  private recorder?: MediaRecorder

  private chunks: Blob[] = []

  constructor(canvas: HTMLCanvasElement, animation: Animated) {
    this.canvas = canvas
    this.animation = animation
  }

  async start() {
    this.setup()
    this.recorder?.start()
    await this.animation.playShots(get(shots))
    this.recorder?.stop()
  }

  setup() {
    this.chunks = []

    this.stream = this.canvas.captureStream(this.framerate)
    this.recorder = new MediaRecorder(this.stream)

    this.recorder.ondataavailable = (e: BlobEvent) => {
      this.chunks.push(e.data)
    }

    this.recorder.onstop = () => {
      const blob = new Blob(this.chunks, { type: this.recorder?.mimeType })
      const link$ = document.createElement('a')
      link$.setAttribute('download', 'video')
      link$.setAttribute('href', URL.createObjectURL(blob))
      link$.click()
    }
  }
}

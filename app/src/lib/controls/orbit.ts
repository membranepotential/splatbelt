import { Vector2 } from 'three'
import type { Control } from './control'
import { damp } from 'three/src/math/MathUtils.js'

enum STATE {
  NONE,
  ROTATE,
  DOLLY,
  PAN,
}

/*
 * Left mouse button: rotate
 * Middle mouse button: dolly (zoom)
 * Right mouse button: pan
 *
 * 1 finger: rotate
 * 2 finger: pan
 * tap and drag: dolly
 */
export class Orbit {
  dampingFactor = 0.005
  control: Control

  private state = STATE.NONE
  private pointers: PointerEvent[] = []
  private pointerPositions: Record<number, Vector2> = {}
  private lastUpTimestamp = -1

  private start = new Vector2()
  private end = new Vector2()
  private delta = new Vector2()
  private lastMove = performance.now()

  constructor(control: Control) {
    this.control = control

    this.onPointerDown = this.onPointerDown.bind(this)
    this.onPointerMove = this.onPointerMove.bind(this)
    this.onPointerUp = this.onPointerUp.bind(this)
    this.onWheel = this.onWheel.bind(this)
  }

  onPointerDown(event: PointerEvent) {
    const target = event.target as HTMLElement

    if (this.pointers.length === 0) {
      target.setPointerCapture(event.pointerId)
      target.addEventListener('pointermove', this.onPointerMove)
      target.addEventListener('pointerup', this.onPointerUp)
    }

    this.addPointer(event)

    if (event.pointerType === 'touch') {
      this.trackPointer(event)
      this.start.set(event.pageX, event.pageY)

      if (this.pointers.length === 1) {
        if (event.timeStamp - this.lastUpTimestamp < 250) {
          this.state = STATE.DOLLY
        } else {
          this.state = STATE.ROTATE
        }
      } else if (this.pointers.length === 2) {
        this.start.x += this.pointers[1].pageX
        this.start.y += this.pointers[1].pageY
        this.start.multiplyScalar(0.5)
        this.state = STATE.PAN
      } else {
        this.state = STATE.NONE
      }
    } else {
      this.start.set(event.clientX, event.clientY)

      if (event.button === 0) {
        this.state = STATE.ROTATE
      } else if (event.button === 1) {
        this.state = STATE.DOLLY
      } else if (event.button === 2) {
        this.state = STATE.PAN
      } else {
        this.state = STATE.NONE
      }
    }
  }

  onPointerMove(event: PointerEvent) {
    if (event.pointerType === 'touch') {
      this.trackPointer(event)
      this.end.set(event.pageX, event.pageY)

      if (this.pointers.length >= 2) {
        const second = this.getSecondPointerPosition(event)
        this.end.x += second.x
        this.end.y += second.y
        this.end.multiplyScalar(0.5)
      }
    } else {
      this.end.set(event.clientX, event.clientY)
    }

    // apply damping to input
    // technically we should track time for each indivudal pointer
    const dt = event.timeStamp - this.lastMove
    this.lastMove = event.timeStamp

    this.end.set(
      damp(this.start.x, this.end.x, this.dampingFactor, dt),
      damp(this.start.y, this.end.y, this.dampingFactor, dt)
    )

    const height = (event.target as HTMLElement).clientHeight
    this.delta.subVectors(this.end, this.start).multiplyScalar(1 / height)

    switch (this.state) {
      case STATE.ROTATE:
        this.control.rotate(this.delta.x, this.delta.y)
        break
      case STATE.DOLLY:
        this.control.dolly(this.delta.y)
        break
      case STATE.PAN:
        this.control.pan(this.delta.x, this.delta.y)
        break
    }

    this.start.copy(this.end)
  }

  onPointerUp(event: PointerEvent) {
    this.lastUpTimestamp = event.timeStamp

    this.removePointer(event)
    if (this.pointers.length === 0) {
      const target = event.target as HTMLElement
      target.releasePointerCapture(event.pointerId)
      target.removeEventListener('pointermove', this.onPointerMove)
      target.removeEventListener('pointerup', this.onPointerUp)
    }

    this.state = STATE.NONE
  }

  onWheel(event: WheelEvent) {
    if (this.state === STATE.NONE) {
      event.preventDefault()
      this.control.dolly(Math.sign(event.deltaY) / 20)
    }
  }

  addPointer(event: PointerEvent) {
    this.pointers.push(event)
  }

  removePointer(event: PointerEvent) {
    delete this.pointerPositions[event.pointerId]
    for (let i = 0; i < this.pointers.length; i++) {
      if (this.pointers[i].pointerId == event.pointerId) {
        this.pointers.splice(i, 1)
        return
      }
    }
  }

  trackPointer(event: PointerEvent) {
    let position = this.pointerPositions[event.pointerId]

    if (position === undefined) {
      position = new Vector2()
      this.pointerPositions[event.pointerId] = position
    }

    position.set(event.pageX, event.pageY)
  }

  getSecondPointerPosition(event: PointerEvent) {
    const pointer =
      event.pointerId === this.pointers[0].pointerId
        ? this.pointers[1]
        : this.pointers[0]

    return this.pointerPositions[pointer.pointerId]
  }
}

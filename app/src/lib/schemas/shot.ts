import { Movement } from '$lib/types'

export const DEFAULT_SCALES: {
  [key in Movement]: { x: number; y: number }
} = {
  [Movement.DOLLY]: { x: 0.1, y: 0.1 },
  [Movement.ZOOM]: { x: 0.01, y: 0.01 },
  [Movement.PAN]: { x: 2, y: 0.05 },
  [Movement.ORBIT]: { x: 0.01, y: 0.003 },
}

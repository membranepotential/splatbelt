interface NumFrameSelection {
  type: 'num'
  num: number
}

interface ListFrameSelection {
  type: 'list'
  frames: number[]
}

type FrameSelection = NumFrameSelection | ListFrameSelection

interface ExhaustivePairing {
  type: 'exhaustive'
}

interface CovisiblePairing {
  num: number
  model: string
}

interface ComplexPairing {
  type: 'complex'
  sequential?: number
  retrieval?: number
  covisible?: CovisiblePairing
}

type Pairing = ExhaustivePairing | ComplexPairing

export type ModelConfig = {
  frames: Record<string, FrameSelection>
  pairing: Pairing
  features: string
  matcher: string
  numIter: number
}

type ModelLogEntry = {
  timestamp: Date
  step: string
  message: string
}

export type Project = {
  id: number
  name: string
  created: Date
  updated: Date
  state: AnalysisState
  config: ModelConfig
  logs: ModelLogEntry[]
}

/* Object on S3 */
export type S3Object = {
  key: string
  name: string
  size: number
  type: string
}

type UploadPart = {
  part: number
  etag: string
}

/* S3 pre-signed upload info */
export type Upload = {
  object: S3Object
  uploadId?: string
  urls: string[]
  partSize: number
  etags?: Array<string>
}

import { v4 as uuid4 } from 'uuid';
import type { Upload } from './upload';

export interface NumFrameSelection {
  type: 'num';
  num: number;
}

export interface ListFrameSelection {
  type: 'list';
  frames: number[];
}

export interface ImageFrameSelection {
  type: 'image';
}

export type FrameSelection =
  | NumFrameSelection
  | ListFrameSelection
  | ImageFrameSelection;

export interface ExhaustivePairing {
  type: 'exhaustive';
}

export interface CovisiblePairing {
  num: number;
  model: string;
}

export interface ComplexPairing {
  type: 'complex';
  sequential: number | null;
  retrieval: number | null;
  covisible: CovisiblePairing | null;
}

export type Pairing = ExhaustivePairing | ComplexPairing;

export type SFMConfig = {
  feature_type: string;
  matcher_type: string;
};

export type SFMState = {
  state:
    | 'fresh'
    | 'pairing'
    | 'extraction'
    | 'matching'
    | 'mapping'
    | 'training'
    | 'done';
  progress: number;
};

export interface Model {
  id: string;
  project: number;
  frames: Record<string, FrameSelection>;
  pairing: Pairing;
  config: SFMConfig;
  state: SFMState;
}

export const defaultFrameSelection = (upload: Upload): FrameSelection => {
  if (upload.type.startsWith('image/')) {
    return { type: 'image' };
  } else {
    return { type: 'num', num: 10 };
  }
};

export function createModel(projectId: number, uploads: Upload[]): Model {
  const frames = Object.fromEntries(
    uploads.map((upload) => [upload.name, defaultFrameSelection(upload)])
  );
  const pairing: Pairing = { type: 'exhaustive' };
  const config: SFMConfig = {
    feature_type: 'sift',
    matcher_type: 'superglue',
  };
  const state: SFMState = {
    state: 'fresh',
    progress: 0,
  };
  return { id: uuid4(), project: projectId, frames, pairing, config, state };
}

export function toWorkerConfig(model: Model) {
  const config = {
    frames: {
      uploads: Object.entries(model.frames).map(([name, selection]) => ({
        name,
        ...selection,
      })),
    },
    pairing: model.pairing,
    feature_matching: {
      feature_type: model.config.feature_type,
      matcher: model.config.matcher_type,
    },
  };
  return { ops: config };
}

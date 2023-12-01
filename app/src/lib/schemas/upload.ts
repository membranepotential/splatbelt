import { z } from 'zod'

export const S3Object = z.object({
  key: z.string(),
  name: z.string(),
  size: z.number(),
  type: z.string(),
})
export type S3Object = z.infer<typeof S3Object>

export const UploadPart = z.object({
  part: z.number(),
  etag: z.string(),
})
export type UploadPart = z.infer<typeof UploadPart>

export const Upload = z.object({
  object: S3Object,
  uploadId: z.string().optional(),
  urls: z.array(z.string()),
  partSize: z.number(),
  etags: z.array(z.string()).optional(),
})
export type Upload = z.infer<typeof Upload>

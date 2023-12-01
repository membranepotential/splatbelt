import {
  prepareUpload,
  completeMultipartUpload,
  listObjects,
  headObject,
} from './s3'
import { S3Object } from '$lib/schemas/upload'

const EXT_TO_TYPE: Record<string, string> = {
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  gif: 'image/gif',
  webp: 'image/webp',
  avif: 'image/avif',
  mp4: 'video/mp4',
  webm: 'video/webm',
  mov: 'video/quicktime',
  mkv: 'video/x-matroska',
  avi: 'video/x-msvideo',
}

function guessType(name: string) {
  const ext = name.split('.').pop()
  if (!ext) return 'application/octet-stream'
  return EXT_TO_TYPE[ext.toLowerCase()] ?? 'application/octet-stream'
}

export async function head(key: string) {
  const name = key.split('/').pop() as string
  const { ContentLength, ContentType } = await headObject(key)
  return S3Object.parse({ key, name, size: ContentLength, type: ContentType })
}

export async function list(projectId: string) {
  const contents = await listObjects(`${projectId}/uploads`)

  const sortKey = (a: any) => a.LastModified?.getTime() ?? 0
  contents.sort((a, b) => sortKey(a) - sortKey(b))

  return contents.map(({ Key, Size }) => {
    const name = Key?.split('/').pop() as string
    const type = guessType(name)
    return S3Object.parse({
      key: Key,
      name,
      size: Size,
      type,
    })
  })
}

export async function listWithType(projectId: string) {
  const objects = await list(projectId)
  return Promise.all(
    objects.map(async (object) => {
      if (
        object.type.startsWith('image/') ||
        object.type.startsWith('video/')
      ) {
        return await head(object.key)
      }
      return object
    })
  )
}

type CreateParams = {
  name: string
  size: number
  type: string
}

export async function create(projectId: string, file: CreateParams) {
  const key = `${projectId}/uploads/${file.name}`
  const upload = await prepareUpload(key, file.size, file.type)
  return { key, ...upload }
}

type CompleteParams = {
  key: string
  uploadId: string
  etags: string[]
}

export function complete({ key, uploadId, etags }: CompleteParams) {
  return completeMultipartUpload(key, uploadId, etags)
}

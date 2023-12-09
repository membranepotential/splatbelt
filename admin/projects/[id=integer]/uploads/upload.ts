import { writable, type Readable } from 'svelte/store'
import { deserialize } from '$app/forms'
import { z } from 'zod'
import type { Upload } from '$lib/schemas'

const preparedResponse = z.object({
  key: z.string(),
  uploadId: z.string().optional(),
  urls: z.array(z.string()),
  partSize: z.number(),
})

async function prepare(file: File) {
  const body = new FormData()
  body.append('name', file.name)
  body.append('size', file.size.toString())
  body.append('type', file.type)

  const response = await fetch('?/prepare', { method: 'POST', body })

  if (!response.ok) {
    console.error('Failed to prepare upload', response)
    throw new Error('Failed to prepare upload')
  }

  const data = deserialize(await response.text())
  if (data.type !== 'success') {
    console.error('Failed to prepare upload', data)
    throw new Error('Failed to prepare upload')
  }

  const { key, ...info } = preparedResponse.parse(data.data)
  const object = { key, name: file.name, type: file.type, size: file.size }
  return { object, ...info } as Upload
}

async function complete(upload: Upload) {
  if (!upload.object.key || !upload.uploadId) {
    return
  }

  const body = new FormData()
  body.append('key', upload.object.key)
  body.append('uploadId', upload.uploadId)
  upload.etags?.forEach((etag) => body.append('etags', etag))

  const res = await fetch('?/complete', { method: 'POST', body })
  if (!res.ok) {
    console.error('Failed to complete upload', res)
  }
}

function slicePart(
  buffer: ArrayBuffer,
  index: number,
  partSize: number
): ArrayBuffer {
  return buffer.slice(index * partSize, (index + 1) * partSize)
}

function uploadPart(
  body: ArrayBuffer,
  url: string,
  type: string
): Promise<Response> {
  const headers = new Headers({
    'Content-Length': body.byteLength.toString(),
    'Content-Type': type,
  })
  return fetch(url, { method: 'PUT', headers, body })
}

function setEtag(upload: Upload, index: number, etag: string) {
  if (!upload.etags) {
    upload.etags = Array(upload.urls.length)
  }
  upload.etags[index] = etag
}

export type UploadStore = Upload & Readable<number>

export async function uploadStore(
  file: File,
  onDone: (upload: Upload) => void
) {
  const upload = await prepare(file)
  const { subscribe, update } = writable(0)

  const reader = new FileReader()
  reader.onload = async (event: ProgressEvent<FileReader>) => {
    const buffer = event.target?.result as ArrayBuffer

    const tasks = upload.urls.map(async (url, index) => {
      if (upload.etags && upload.etags[index]) {
        // skip because etag exists
        return
      }

      const body = slicePart(buffer, index, upload.partSize)
      const response = await uploadPart(body, url, upload.object.type)

      if (!response.ok) {
        throw new Error(`Failed to upload part ${index}`)
      }

      setEtag(upload, index, response.headers.get('ETag') as string)

      update((completed) => completed + 1)
    })

    await Promise.all(tasks)
    await complete(upload)
    onDone(upload)
  }

  reader.readAsArrayBuffer(file)

  return { ...upload, subscribe } as UploadStore
}

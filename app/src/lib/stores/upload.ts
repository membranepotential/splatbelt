import { writable } from 'svelte/store'
import { deserialize } from '$app/forms'

type Upload = {
  id: string
  key: string
  name: string
  type: string
  size: number
  uploadId: string
  urls: string[]
  partSize: number
  etags?: string[]
}

async function prepare(file: File): Promise<Upload> {
  const body = new FormData()
  body.append('name', file.name)
  body.append('size', file.size.toString())
  body.append('type', file.type)

  const res = await fetch('?/prepare', { method: 'POST', body })
    .then((res) => res.text())
    .then(deserialize)

  if (res.type !== 'success') {
    console.error('Failed to prepare upload', res)
    throw new Error('Failed to prepare upload')
  }

  return {
    name: file.name,
    type: file.type,
    size: file.size,
    ...res.data,
  } as Upload
}

async function complete(upload: Upload) {
  const body = new FormData()
  body.append('id', upload.id)
  body.append('name', upload.name)
  body.append('key', upload.key)
  body.append('uploadId', upload.uploadId)
  upload.etags.forEach((etag) => body.append('etags', etag))

  const res = await fetch('?/complete', { method: 'POST', body })
    .then((res) => res.text())
    .then(deserialize)

  if (res.type !== 'success') {
    console.error('Failed to complete upload', res)
    throw new Error('Failed to complete upload')
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

const store = writable<number | null>(null)

async function start(file: File): Promise<string> {
  const upload = await prepare(file)
  store.set(0)

  const reader = new FileReader()

  return new Promise((resolve, reject) => {
    reader.onload = async (event: ProgressEvent<FileReader>) => {
      const buffer = event.target?.result as ArrayBuffer

      const tasks = upload.urls.map(async (url, index) => {
        if (upload.etags?.[index]) {
          // skip because etag exists
          return
        }

        const body = slicePart(buffer, index, upload.partSize)
        const response = await uploadPart(body, url, upload.type)

        if (!response.ok) {
          reject(new Error(`Failed to upload part ${index}`))
        }

        setEtag(upload, index, response.headers.get('ETag') as string)
        store.update(
          (completed) => (completed ?? 0) + body.byteLength / upload.size
        )
      })

      await Promise.all(tasks)
      await complete(upload)

      console.log('upload complete', upload)
      store.set(null)
      resolve(upload.id)
    }

    console.log('upload start', upload)
    reader.readAsArrayBuffer(file)
  })
}

export default { subscribe: store.subscribe, start }

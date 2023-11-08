import { range } from 'lodash-es'
import {
  S3Client,
  CompleteMultipartUploadCommand,
  CreateMultipartUploadCommand,
  GetObjectCommand,
  PutObjectCommand,
  UploadPartCommand,
  HeadObjectCommand,
  ListObjectsV2Command,
} from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import type { S3ClientConfigType } from '@aws-sdk/client-s3'

import {
  S3_ENDPOINT,
  S3_BUCKET,
  AWS_ACCESS_KEY_ID,
  AWS_SECRET_ACCESS_KEY,
  AWS_REGION,
} from '$env/static/private'

const MAX_PART_SIZE = 1024 * 1024 * 5
const EXPIRES_IN = 60 * 60 * 24

const s3 = (() => {
  const config: S3ClientConfigType = {
    region: AWS_REGION,
    credentials: {
      accessKeyId: AWS_ACCESS_KEY_ID,
      secretAccessKey: AWS_SECRET_ACCESS_KEY,
    },
  }
  if (S3_ENDPOINT) {
    config.endpoint = S3_ENDPOINT
    config.forcePathStyle = true
  }
  return new S3Client(config)
})()

export function generatePresignedUrl(key: string, method: 'GET' | 'PUT') {
  const obj = { Key: key, Bucket: S3_BUCKET }
  let command = null
  switch (method) {
    case 'GET':
      command = new GetObjectCommand(obj)
      break
    case 'PUT':
      command = new PutObjectCommand(obj)
      break
    default:
      throw new Error('Invalid method')
  }
  return getSignedUrl(s3, command, { expiresIn: EXPIRES_IN })
}

function generatePresignedPartUrls(
  key: string,
  uploadId: string,
  partCount: number
) {
  const obj = {
    Key: key,
    Bucket: S3_BUCKET,
    Region: AWS_REGION,
    UploadId: uploadId,
  }
  const urls = range(partCount).map((index) => {
    const command = new UploadPartCommand({ ...obj, PartNumber: index + 1 })
    return getSignedUrl(s3, command, { expiresIn: EXPIRES_IN })
  })
  return Promise.all(urls)
}

function initiateMultipartUpload(key: string, type: string) {
  return s3
    .send(
      new CreateMultipartUploadCommand({
        Key: key,
        Bucket: S3_BUCKET,
        ContentType: type,
      })
    )
    .then(({ UploadId }) => UploadId as string)
}

async function prepareSinglePartUpload(key: string) {
  const url = await generatePresignedUrl(key, 'PUT')
  return { urls: [url], partSize: MAX_PART_SIZE }
}

async function prepareMultiPartUpload(key: string, size: number, type: string) {
  const uploadId = await initiateMultipartUpload(key, type)
  if (!uploadId) throw new Error('Failed to initiate multipart upload')

  const partCount = Math.ceil(size / MAX_PART_SIZE)
  const urls = await generatePresignedPartUrls(key, uploadId, partCount)
  return { uploadId, urls, partSize: MAX_PART_SIZE }
}

export function prepareUpload(key: string, size: number, type: string) {
  return size > MAX_PART_SIZE
    ? prepareMultiPartUpload(key, size, type)
    : prepareSinglePartUpload(key)
}

export function completeMultipartUpload(
  key: string,
  uploadId: string,
  etags: string[]
) {
  const parts = etags.map((etag, index) => ({
    ETag: etag,
    PartNumber: index + 1,
  }))
  return s3.send(
    new CompleteMultipartUploadCommand({
      Key: key,
      Bucket: S3_BUCKET,
      MultipartUpload: { Parts: parts },
      UploadId: uploadId,
    })
  )
}

export function listObjects(prefix: string) {
  return s3
    .send(
      new ListObjectsV2Command({
        Bucket: S3_BUCKET,
        Prefix: prefix,
      })
    )
    .then(({ Contents }) => Contents ?? [])
}

export function headObject(key: string) {
  return s3.send(
    new HeadObjectCommand({
      Bucket: S3_BUCKET,
      Key: key,
    })
  )
}

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

import { Bucket } from 'sst/node/bucket'

const MAX_PART_SIZE = 1024 * 1024 * 5
const EXPIRES_IN = 60 * 60 * 24

const s3 = () => new S3Client({})

export function generatePresignedUrl(key: string, method: 'GET' | 'PUT') {
  const obj = { Key: key, Bucket: Bucket.storage.bucketName }
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
  return getSignedUrl(s3(), command, { expiresIn: EXPIRES_IN })
}

function generatePresignedPartUrls(
  key: string,
  uploadId: string,
  partCount: number
) {
  const obj = {
    Key: key,
    Bucket: Bucket.storage.bucketName,
    // Region: AWS_REGION,
    UploadId: uploadId,
  }
  const urls = range(partCount).map((index) => {
    const command = new UploadPartCommand({ ...obj, PartNumber: index + 1 })
    return getSignedUrl(s3(), command, { expiresIn: EXPIRES_IN })
  })
  return Promise.all(urls)
}

async function initiateMultipartUpload(key: string, type: string) {
  const { UploadId } = await s3().send(
    new CreateMultipartUploadCommand({
      Key: key,
      Bucket: Bucket.storage.bucketName,
      ContentType: type,
    })
  )
  return UploadId as string
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
  return s3().send(
    new CompleteMultipartUploadCommand({
      Key: key,
      Bucket: Bucket.storage.bucketName,
      MultipartUpload: { Parts: parts },
      UploadId: uploadId,
    })
  )
}

export async function listObjects(prefix: string) {
  const { Contents } = await s3().send(
    new ListObjectsV2Command({
      Bucket: Bucket.storage.bucketName,
      Prefix: prefix,
    })
  )
  return Contents ?? []
}

export function headObject(key: string) {
  return s3().send(
    new HeadObjectCommand({
      Bucket: Bucket.storage.bucketName,
      Key: key,
    })
  )
}

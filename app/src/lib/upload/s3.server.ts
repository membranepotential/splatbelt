import { range } from 'lodash-es';
import {
  S3Client,
  CompleteMultipartUploadCommand,
  CreateMultipartUploadCommand,
  GetObjectCommand,
  PutObjectCommand,
  UploadPartCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import {
  S3_ENDPOINT,
  S3_BUCKET,
  AWS_ACCESS_KEY_ID,
  AWS_SECRET_ACCESS_KEY,
  AWS_REGION,
} from '$env/static/private';
import type { RequestHandler } from '@sveltejs/kit';
import type { S3ClientConfigType, CompletedPart } from '@aws-sdk/client-s3';

const MAX_PART_SIZE = 1024 * 1024 * 5;
const EXPIRES_IN = 60 * 60 * 24;

const s3 = (() => {
  const config: S3ClientConfigType = {
    region: AWS_REGION,
    credentials: {
      accessKeyId: AWS_ACCESS_KEY_ID,
      secretAccessKey: AWS_SECRET_ACCESS_KEY,
    },
  };
  if (S3_ENDPOINT) {
    config.endpoint = S3_ENDPOINT;
    config.forcePathStyle = true;
  }
  return new S3Client(config);
})();

async function generatePresignedUrl(
  key: string,
  method: 'GET' | 'PUT' = 'PUT'
) {
  const obj = { Key: key, Bucket: S3_BUCKET };
  let command = null;
  switch (method) {
    case 'GET':
      command = new GetObjectCommand(obj);
      break;
    case 'PUT':
      command = new PutObjectCommand(obj);
      break;
    default:
      throw new Error('Invalid method');
  }
  return getSignedUrl(s3, command, { expiresIn: EXPIRES_IN });
}

async function generatePresignedPartUrls(
  key: string,
  uploadId: string,
  partCount: number
) {
  const obj = {
    Key: key,
    Bucket: S3_BUCKET,
    Region: AWS_REGION,
    UploadId: uploadId,
  };
  const urls = range(partCount).map((_, index) => {
    const command = new UploadPartCommand({ ...obj, PartNumber: index + 1 });
    return getSignedUrl(s3, command, { expiresIn: EXPIRES_IN });
  });
  return await Promise.all(urls);
}

async function initiateMultipartUpload(key: string): Promise<string> {
  return s3
    .send(new CreateMultipartUploadCommand({ Key: key, Bucket: S3_BUCKET }))
    .then(({ UploadId }) => UploadId as string);
}

async function completeMultipartUpload(
  key: string,
  uploadId: string,
  parts: CompletedPart[]
) {
  return s3.send(
    new CompleteMultipartUploadCommand({
      Key: key,
      Bucket: S3_BUCKET,
      MultipartUpload: { Parts: parts },
      UploadId: uploadId,
    })
  );
}

async function prepareSinglePartTransfer(key: string) {
  const url = await generatePresignedUrl(key);
  return { uploadId: null, urls: [url], partSize: MAX_PART_SIZE };
}

async function prepareMultiPartTransfer(key: string, size: number) {
  const uploadId = await initiateMultipartUpload(key);
  if (!uploadId) throw new Error('Failed to initiate multipart upload');

  const partCount = Math.ceil(size / MAX_PART_SIZE);
  const urls = await generatePresignedPartUrls(key, uploadId, partCount);
  return { uploadId, urls, partSize: MAX_PART_SIZE };
}

export async function prepare({ key, size }: { key: string; size: number }) {
  const upload =
    size > MAX_PART_SIZE
      ? await prepareMultiPartTransfer(key, size)
      : await prepareSinglePartTransfer(key);

  return new Response(JSON.stringify(upload));
}

export async function complete({
  key,
  uploadId,
  etags,
}: {
  key: string;
  uploadId: string;
  etags: string[];
}): Promise<Response> {
  const parts = etags.map((etag, index) => ({
    ETag: etag,
    PartNumber: index + 1,
  }));
  await completeMultipartUpload(key, uploadId, parts);
  return new Response();
}

export const POST: RequestHandler = async ({ request, setHeaders }) => {
  setHeaders({
    'Content-Type': 'application/json',
  });

  const { operation, body } = await request.json();
  switch (operation) {
    case 'prepare':
      return prepare(body);
    case 'complete':
      return complete(body);
    default:
      return new Response('Invalid operation', { status: 400 });
  }
};

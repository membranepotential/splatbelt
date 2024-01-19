import { generatePresignedUrl, headObject } from './s3'

export function pointCloudKey(projectId: string) {
  return `${projectId}/model.ply`
}

export function getDownloadUrl(projectId: string) {
  return generatePresignedUrl(pointCloudKey(projectId), 'GET')
}

export async function exists(projectId: string): Promise<boolean> {
  try {
    await headObject(pointCloudKey(projectId))
    return true
  } catch (error) {
    if (error.name === 'NotFound') return false
    throw error
  }
}

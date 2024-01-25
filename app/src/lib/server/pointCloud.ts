import { generatePresignedUrl, headObject } from './s3'

export async function pointCloudKey(userId: string, projectId: string) {
  return `${userId}/${projectId}/model/model.ply`
}

export async function getDownloadUrl(userId: string, projectId: string) {
  const key = await pointCloudKey(userId, projectId)
  return generatePresignedUrl(key, 'GET')
}

export async function exists(
  userId: string,
  projectId: string
): Promise<boolean> {
  try {
    const key = await pointCloudKey(userId, projectId)
    await headObject(key)
    return true
  } catch (error) {
    if (error.name === 'NotFound') return false
    throw error
  }
}

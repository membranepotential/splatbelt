import { generatePresignedUrl, headObject } from './s3'
import { fetchUserAttributes } from 'aws-amplify/auth'

export async function pointCloudKey(projectId: string) {
  const { sub } = await fetchUserAttributes()
  return `${sub}/${projectId}/model.ply`
}

export async function getDownloadUrl(projectId: string) {
  const key = await pointCloudKey(projectId)
  return generatePresignedUrl(key, 'GET')
}

export async function exists(projectId: string): Promise<boolean> {
  try {
    const key = await pointCloudKey(projectId)
    await headObject(key)
    return true
  } catch (error) {
    if (error.name === 'NotFound') return false
    throw error
  }
}

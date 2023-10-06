export interface Upload {
  key: string
  name: string
  size: number
  type: string
  transferred: number
}

export const createUpload = (file: File, key: string): Upload => {
  return {
    key,
    name: file.name,
    size: file.size,
    type: file.type,
    transferred: 0,
  }
}

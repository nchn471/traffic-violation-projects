export function getMediaUrl(filePath: string): string {
  return `/api/v1/media/file/${filePath}`
}

export function getThumbnailUrl(filePath: string): string {
  return `/api/v1/media/thumbnail/${filePath}`
}

export interface UploadIntent {
  filename: string
  contentType: string
  size: number
}

export interface SignedUploadPayload {
  key: string
  uploadUrl: string
  publicUrl: string
  headers: Record<string, string>
}

export interface UploadResult {
  key: string
  publicUrl: string
}

export interface StorageConfig {
  bucket: string
  region: string
  endpoint: string
  publicBaseUrl: string
}

export interface StorageService {
  createSignedUpload(intent: UploadIntent): Promise<SignedUploadPayload>
  deleteFile(key: string): Promise<void>
  getPublicUrl(key: string): string
}

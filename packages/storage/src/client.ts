import type { SignedUploadPayload, UploadResult } from "./types"

export async function requestSignedUpload(
  file: File
): Promise<SignedUploadPayload> {
  const response = await fetch("/api/upload", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      filename: file.name,
      contentType: file.type,
      size: file.size,
    }),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Upload request failed: ${error}`)
  }

  return response.json()
}

export async function uploadFile(file: File): Promise<UploadResult> {
  const { key, uploadUrl, publicUrl, headers } = await requestSignedUpload(file)

  const uploadResponse = await fetch(uploadUrl, {
    method: "PUT",
    headers: {
      "Content-Type": file.type,
      ...headers,
    },
    body: file,
  })

  if (!uploadResponse.ok) {
    throw new Error(`Upload failed: ${uploadResponse.statusText}`)
  }

  return { key, publicUrl }
}

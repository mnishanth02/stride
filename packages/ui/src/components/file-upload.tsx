"use client"

import { Progress } from "@workspace/ui/components/progress"
import { cn } from "@workspace/ui/lib/utils"
import {
  ACCEPTED_IMAGE_TYPES,
  MAX_IMAGE_SIZE,
  TARGET_COMPRESSED_SIZE,
} from "@workspace/ui/lib/validations"
import * as React from "react"

type UploadShape = "circle" | "square"

interface FileUploadProps {
  value?: File | null
  onChange?: (file: File | null) => void
  onError?: (error: string) => void
  shape?: UploadShape
  previewUrl?: string
  disabled?: boolean
  className?: string
}

const ACCEPTED_EXTENSIONS = [".jpg", ".jpeg", ".png", ".webp"]

function getFileExtension(name: string): string {
  const idx = name.lastIndexOf(".")
  return idx >= 0 ? name.slice(idx).toLowerCase() : ""
}

function validateFile(file: File): string | null {
  // SEC-001: validate MIME type
  if (
    !ACCEPTED_IMAGE_TYPES.includes(
      file.type as (typeof ACCEPTED_IMAGE_TYPES)[number]
    )
  ) {
    return "Only JPEG, PNG, and WebP images are accepted"
  }
  // SEC-001: validate extension
  const ext = getFileExtension(file.name)
  if (!ACCEPTED_EXTENSIONS.includes(ext)) {
    return "Invalid file extension"
  }
  // Size check
  if (file.size > MAX_IMAGE_SIZE) {
    return "File must be under 5MB"
  }
  return null
}

async function compressImage(file: File): Promise<File> {
  if (file.size <= TARGET_COMPRESSED_SIZE) return file

  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)

    img.onload = () => {
      URL.revokeObjectURL(url)

      const canvas = document.createElement("canvas")
      let { width, height } = img

      // Scale down if needed
      const maxDim = 1920
      if (width > maxDim || height > maxDim) {
        const ratio = Math.min(maxDim / width, maxDim / height)
        width = Math.round(width * ratio)
        height = Math.round(height * ratio)
      }

      canvas.width = width
      canvas.height = height

      const ctx = canvas.getContext("2d")
      if (!ctx) {
        reject(new Error("Could not get canvas context"))
        return
      }

      ctx.drawImage(img, 0, 0, width, height)

      // Always output as JPEG for quality-based compression (PNG ignores quality param)
      let quality = 0.8
      const outputType = "image/jpeg"

      function tryCompress() {
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error("Compression failed"))
              return
            }

            if (blob.size <= TARGET_COMPRESSED_SIZE || quality <= 0.3) {
              const compressed = new File([blob], file.name, {
                type: blob.type,
                lastModified: Date.now(),
              })
              resolve(compressed)
            } else {
              quality -= 0.1
              tryCompress()
            }
          },
          outputType,
          quality
        )
      }

      tryCompress()
    }

    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error("Failed to load image"))
    }

    img.src = url
  })
}

function FileUpload({
  value,
  onChange,
  onError,
  shape = "square",
  previewUrl: initialPreviewUrl,
  disabled,
  className,
}: FileUploadProps) {
  const [preview, setPreview] = React.useState<string | null>(
    initialPreviewUrl ?? null
  )
  const [isDragging, setIsDragging] = React.useState(false)
  const [isCompressing, setIsCompressing] = React.useState(false)
  const [compressionProgress, setCompressionProgress] = React.useState(0)
  const inputRef = React.useRef<HTMLInputElement>(null)

  React.useEffect(() => {
    if (value) {
      const url = URL.createObjectURL(value)
      setPreview(url)
      return () => URL.revokeObjectURL(url)
    }
    // When value is cleared, fall back to server-provided previewUrl
    setPreview(initialPreviewUrl ?? null)
  }, [value, initialPreviewUrl])

  async function processFile(file: File) {
    const error = validateFile(file)
    if (error) {
      onError?.(error)
      return
    }

    setIsCompressing(true)
    setCompressionProgress(30)

    try {
      const compressed = await compressImage(file)
      setCompressionProgress(100)
      onChange?.(compressed)
    } catch {
      onError?.("Failed to process image")
    } finally {
      setTimeout(() => {
        setIsCompressing(false)
        setCompressionProgress(0)
      }, 300)
    }
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault()
    if (!disabled) setIsDragging(true)
  }

  function handleDragLeave(e: React.DragEvent) {
    e.preventDefault()
    setIsDragging(false)
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setIsDragging(false)
    if (disabled || isCompressing) return
    const file = e.dataTransfer.files[0]
    if (file) processFile(file)
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (isCompressing) return
    const file = e.target.files?.[0]
    if (file) processFile(file)
    if (inputRef.current) inputRef.current.value = ""
  }

  function handleRemove() {
    setPreview(null)
    onChange?.(null)
  }

  const isCircle = shape === "circle"

  if (preview) {
    return (
      <div
        className={cn(
          "group relative overflow-hidden border-2 border-border",
          isCircle
            ? "size-32 rounded-full"
            : "aspect-square w-full max-w-xs rounded-lg",
          className
        )}
      >
        <img
          src={preview}
          alt="Upload preview"
          className="size-full object-cover"
        />
        {!disabled && (
          <button
            type="button"
            onClick={handleRemove}
            className="absolute inset-0 flex items-center justify-center bg-foreground/60 opacity-0 transition-opacity focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring group-hover:opacity-100"
          >
            <span className="font-medium text-background text-sm">Remove</span>
          </button>
        )}
      </div>
    )
  }

  return (
    // biome-ignore lint/a11y/useSemanticElements: div needed for drag-drop zone containing hidden file input
    <div
      role="button"
      tabIndex={disabled ? -1 : 0}
      onClick={() => !disabled && inputRef.current?.click()}
      onKeyDown={(e) => {
        if (!disabled && (e.key === "Enter" || e.key === " ")) {
          e.preventDefault()
          inputRef.current?.click()
        }
      }}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={cn(
        "flex cursor-pointer flex-col items-center justify-center gap-2 border-2 border-dashed p-6 transition-colors",
        isCircle
          ? "size-32 rounded-full"
          : "aspect-square w-full max-w-xs rounded-lg",
        isDragging
          ? "border-primary bg-primary/5"
          : "border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/50",
        disabled && "pointer-events-none opacity-50",
        className
      )}
    >
      {isCompressing ? (
        <div
          className="w-full max-w-[120px] space-y-2"
          role="status"
          aria-live="polite"
        >
          <Progress value={compressionProgress} className="h-1.5" />
          <p className="text-center text-muted-foreground text-xs">
            Compressing…
          </p>
        </div>
      ) : (
        <>
          {/* biome-ignore lint/a11y/noSvgWithoutTitle: decorative icon, described by adjacent text */}
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.5}
            className="size-8 text-muted-foreground"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 16.5V9.75m0 0 3 3m-3-3-3 3M6.75 19.5a4.5 4.5 0 0 1-1.41-8.775 5.25 5.25 0 0 1 10.233-2.33 3 3 0 0 1 3.758 3.848A3.752 3.752 0 0 1 18 19.5H6.75Z"
            />
          </svg>
          <p className="text-center text-muted-foreground text-xs">
            {isDragging ? "Drop image here" : "Click or drag to upload"}
          </p>
          <p className="text-center text-[10px] text-muted-foreground/60">
            JPEG, PNG, WebP · Max 5MB
          </p>
        </>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleInputChange}
        className="hidden"
        disabled={disabled}
      />
    </div>
  )
}

export type { FileUploadProps, UploadShape }
export { FileUpload }

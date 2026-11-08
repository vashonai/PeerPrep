import { ATTACHMENT_RULES } from '../data/models'

const SIGNATURES = {
  'application/pdf': [[0x25, 0x50, 0x44, 0x46]], // %PDF
  'image/png': [[0x89, 0x50, 0x4e, 0x47]],
  'image/jpeg': [[0xff, 0xd8, 0xff]],
}

const MIME_BY_EXTENSION = { pdf: 'application/pdf', png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg' }

export const ACCEPT_ATTRIBUTE = '.pdf,.png,.jpg,.jpeg,application/pdf,image/png,image/jpeg'

export function fileExtension(name) {
  const dot = name.lastIndexOf('.')
  return dot === -1 ? '' : name.slice(dot + 1).toLowerCase()
}

export function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export const isImage = (attachment) => attachment.mimeType.startsWith('image/')

/**
 * Checks extension, declared type, size and the file's magic bytes so a
 * renamed executable cannot pass as a PDF or image. Returns an error message
 * or null.
 */
export async function validateFile(file) {
  const mimeType = MIME_BY_EXTENSION[fileExtension(file.name)]
  if (!mimeType) return `"${file.name}" is not supported. Upload a PDF, JPG, JPEG or PNG file.`
  if (file.type && file.type !== mimeType) return `"${file.name}" does not match its file extension.`
  if (file.size === 0) return `"${file.name}" is empty.`
  if (file.size > ATTACHMENT_RULES.maxBytes)
    return `"${file.name}" is ${formatBytes(file.size)}. Files must be ${formatBytes(ATTACHMENT_RULES.maxBytes)} or smaller.`

  const header = new Uint8Array(await file.slice(0, 8).arrayBuffer())
  const matches = SIGNATURES[mimeType].some((sig) => sig.every((byte, i) => header[i] === byte))
  if (!matches) return `"${file.name}" appears to be corrupted or is not a genuine ${fileExtension(file.name).toUpperCase()} file.`
  return null
}

function readAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(file)
  })
}

/** Converts a validated File into the attachment payload sent to the service layer. */
export async function toAttachmentDraft(file) {
  return {
    id: `draft-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    fileName: file.name,
    mimeType: MIME_BY_EXTENSION[fileExtension(file.name)],
    size: file.size,
    url: await readAsDataUrl(file),
  }
}

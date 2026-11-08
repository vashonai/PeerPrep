import { Download, FileText, ImageIcon, UploadCloud, X } from 'lucide-react'
import { useId, useRef, useState } from 'react'
import { ATTACHMENT_RULES } from '../data/models'
import { cx } from '../utils/cx'
import { ACCEPT_ATTRIBUTE, formatBytes, isImage, toAttachmentDraft, validateFile } from '../utils/files'
import { FieldError } from './ui/Form'
import { Modal } from './ui/Modal'

function FileThumb({ attachment, className }) {
  if (isImage(attachment) && attachment.url)
    return <img src={attachment.url} alt="" className={cx('size-full object-cover', className)} />
  const Icon = isImage(attachment) ? ImageIcon : FileText
  return (
    <span className={cx('grid size-full place-items-center bg-red-50 text-red-600', className)}>
      <Icon className="size-5" aria-hidden />
    </span>
  )
}

/** Drag-and-drop picker with client-side validation and previews. */
export function AttachmentPicker({ value, onChange, error, disabled }) {
  const inputRef = useRef(null)
  const inputId = useId()
  const [dragging, setDragging] = useState(false)
  const [problems, setProblems] = useState([])
  const remaining = ATTACHMENT_RULES.maxFiles - value.length

  const addFiles = async (fileList) => {
    const files = [...fileList]
    const issues = []
    if (files.length > remaining) issues.push(`You can attach up to ${ATTACHMENT_RULES.maxFiles} files.`)
    const accepted = []
    for (const file of files.slice(0, Math.max(0, remaining))) {
      const issue = await validateFile(file)
      if (issue) issues.push(issue)
      else accepted.push(await toAttachmentDraft(file))
    }
    setProblems(issues)
    if (accepted.length) onChange([...value, ...accepted])
    if (inputRef.current) inputRef.current.value = ''
  }

  return (
    <div>
      {remaining > 0 && (
        <label
          htmlFor={inputId}
          onDragOver={(e) => {
            e.preventDefault()
            setDragging(true)
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault()
            setDragging(false)
            if (!disabled) addFiles(e.dataTransfer.files)
          }}
          className={cx(
            'flex cursor-pointer flex-col items-center rounded-xl border-2 border-dashed px-6 py-6 text-center transition',
            dragging ? 'border-brand-400 bg-brand-50' : 'border-slate-300 bg-slate-50/60 hover:border-brand-300 hover:bg-brand-50/40',
            disabled && 'pointer-events-none opacity-60',
          )}
        >
          <UploadCloud className="size-7 text-brand-500" aria-hidden />
          <span className="mt-2 text-sm font-medium text-slate-700">
            <span className="text-brand-600">Choose a file</span> or drag it here
          </span>
          <span className="mt-1 text-xs text-slate-500">
            PDF, JPG, JPEG or PNG · up to {formatBytes(ATTACHMENT_RULES.maxBytes)} each · {remaining} remaining
          </span>
          <input ref={inputRef} id={inputId} type="file" accept={ACCEPT_ATTRIBUTE} multiple className="sr-only" disabled={disabled} onChange={(e) => addFiles(e.target.files)} />
        </label>
      )}

      {problems.map((p) => (
        <FieldError key={p}>{p}</FieldError>
      ))}
      <FieldError>{error}</FieldError>

      {value.length > 0 && (
        <ul className="mt-3 grid gap-2 sm:grid-cols-2">
          {value.map((attachment) => (
            <li key={attachment.id} className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-2 pr-3">
              <span className="size-12 shrink-0 overflow-hidden rounded-lg border border-slate-100">
                <FileThumb attachment={attachment} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium text-slate-800">{attachment.fileName}</span>
                <span className="text-xs text-slate-500">{formatBytes(attachment.size)}</span>
              </span>
              <button
                type="button"
                onClick={() => onChange(value.filter((a) => a.id !== attachment.id))}
                disabled={disabled}
                className="rounded-lg p-1.5 text-slate-400 transition hover:bg-red-50 hover:text-red-600"
                aria-label={`Remove ${attachment.fileName}`}
              >
                <X className="size-4" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

/** Read-only attachment list: image previews open in a lightbox, PDFs download. */
export function AttachmentList({ attachments }) {
  const [preview, setPreview] = useState(null)
  if (!attachments?.length) return null

  return (
    <>
      <ul className="flex flex-wrap gap-3">
        {attachments.map((attachment) => (
          <li key={attachment.id}>
            {isImage(attachment) ? (
              <button
                type="button"
                onClick={() => setPreview(attachment)}
                className="group flex w-56 items-center gap-3 rounded-xl border border-slate-200 bg-white p-2 pr-3 text-left transition hover:border-brand-300"
              >
                <span className="size-12 shrink-0 overflow-hidden rounded-lg border border-slate-100">
                  <FileThumb attachment={attachment} className="transition group-hover:scale-105" />
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-sm font-medium text-slate-800">{attachment.fileName}</span>
                  <span className="text-xs text-slate-500">Image · {formatBytes(attachment.size)}</span>
                </span>
              </button>
            ) : (
              <a
                href={attachment.url}
                download={attachment.fileName}
                className="flex w-56 items-center gap-3 rounded-xl border border-slate-200 bg-white p-2 pr-3 transition hover:border-brand-300"
              >
                <span className="size-12 shrink-0 overflow-hidden rounded-lg">
                  <FileThumb attachment={attachment} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium text-slate-800">{attachment.fileName}</span>
                  <span className="text-xs text-slate-500">PDF · {formatBytes(attachment.size)}</span>
                </span>
                <Download className="size-4 shrink-0 text-slate-400" aria-label="Download" />
              </a>
            )}
          </li>
        ))}
      </ul>
      <Modal
        open={Boolean(preview)}
        onClose={() => setPreview(null)}
        title={preview?.fileName}
        size="lg"
        footer={
          preview && (
            <a href={preview.url} download={preview.fileName} className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-brand-600 px-4 text-sm font-medium text-white hover:bg-brand-700">
              <Download className="size-4" aria-hidden /> Download
            </a>
          )
        }
      >
        {preview && <img src={preview.url} alt={preview.fileName} className="mx-auto max-h-[60vh] rounded-lg" />}
      </Modal>
    </>
  )
}

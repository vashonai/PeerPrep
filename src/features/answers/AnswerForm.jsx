import { Send } from 'lucide-react'
import { useId, useState } from 'react'
import { AttachmentPicker } from '../../components/Attachments'
import { Button } from '../../components/ui/Button'
import { FormAlert, FormField, Textarea } from '../../components/ui/Form'
import { LIMITS } from '../../data/models'
import { useForm } from '../../hooks/useForm'
import { validateAnswer } from '../../utils/validation'

/** Create or edit an answer. `onSubmit(values)` should throw ApiError on failure. */
export function AnswerForm({ initial, onSubmit, onCancel, submitLabel = 'Post answer', autoFocus = false }) {
  const id = useId()
  const [attachments, setAttachments] = useState(initial?.attachments ?? [])
  const form = useForm({ content: initial?.content ?? '' }, validateAnswer)

  const submit = form.handleSubmit(async (values) => {
    await onSubmit({ ...values, attachments })
    if (!initial) {
      form.reset()
      setAttachments([])
    }
  })

  const length = form.values.content.trim().length

  return (
    <form onSubmit={submit} noValidate className="space-y-4">
      <FormAlert>{form.formError}</FormAlert>
      <FormField
        id={`${id}-content`}
        label={initial ? 'Edit your answer' : 'Your answer'}
        required
        error={form.errors.content}
        action={<span className="text-xs text-slate-400 tabular-nums">{length}/{LIMITS.answerContent.max}</span>}
      >
        <Textarea rows={initial ? 6 : 7} autoFocus={autoFocus} placeholder="Explain your working step by step so others can follow it…" {...form.field('content')} />
      </FormField>
      <div>
        <p className="mb-1.5 text-sm font-medium text-slate-700">
          Supporting files <span className="font-normal text-slate-400">(optional)</span>
        </p>
        <AttachmentPicker value={attachments} onChange={setAttachments} error={form.errors.attachments} disabled={form.submitting} />
      </div>
      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        {onCancel && (
          <Button variant="secondary" onClick={onCancel} disabled={form.submitting}>
            Cancel
          </Button>
        )}
        <Button type="submit" icon={initial ? undefined : Send} loading={form.submitting}>
          {submitLabel}
        </Button>
      </div>
    </form>
  )
}

import { AttachmentPicker } from '../../components/Attachments'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { FieldError, FormAlert, FormField, Input, Select, Textarea } from '../../components/ui/Form'
import { DIFFICULTIES, LIMITS } from '../../data/models'
import { useForm } from '../../hooks/useForm'
import { cx } from '../../utils/cx'
import { validateQuestion } from '../../utils/validation'

const DIFFICULTY_HINTS = { Easy: 'Recall or a single step', Medium: 'Several steps or concepts', Hard: 'Extended or proof-style' }

function Counter({ value, max }) {
  const length = value.trim().length
  return <span className={cx('text-xs tabular-nums', length > max ? 'text-red-600' : 'text-slate-400')}>{length}/{max}</span>
}

/**
 * Upload / edit form for a question. Validation is shared with the service
 * layer, including the rule that the topic must belong to the chosen course.
 */
export function QuestionForm({ courses, initial, onSubmit, onCancel, submitLabel }) {
  const topics = courses.flatMap((c) => c.topics)
  const form = useForm(
    {
      title: initial?.title ?? '',
      content: initial?.content ?? '',
      courseId: initial?.courseId ?? '',
      topicId: initial?.topicId ?? '',
      difficulty: initial?.difficulty ?? '',
      attachments: initial?.attachments ?? [],
    },
    (values) => validateQuestion(values, { courses, topics }),
  )
  const { values, errors } = form
  const courseTopics = courses.find((c) => c.id === values.courseId)?.topics ?? []

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} noValidate className="space-y-6">
      <FormAlert>{form.formError}</FormAlert>

      <Card className="space-y-5 p-5 sm:p-6">
        <div>
          <h2 className="text-base font-semibold text-slate-900">Question</h2>
          <p className="mt-0.5 text-sm text-slate-500">Write the question as it appeared on the paper, including the year and question number if you know them.</p>
        </div>
        <FormField id="title" label="Title" required error={errors.title} action={<Counter value={values.title} max={LIMITS.questionTitle.max} />}>
          <Input placeholder="e.g. Decompose R(A, B, C, D, E) into BCNF" {...form.field('title')} />
        </FormField>
        <FormField id="content" label="Question content" required error={errors.content} action={<Counter value={values.content} max={LIMITS.questionContent.max} />}>
          <Textarea rows={9} placeholder="Type out the full question, including any sub-parts (a), (b), (c)…" {...form.field('content')} />
        </FormField>
      </Card>

      <Card className="space-y-5 p-5 sm:p-6">
        <div>
          <h2 className="text-base font-semibold text-slate-900">Category</h2>
          <p className="mt-0.5 text-sm text-slate-500">Helps classmates find this question when they revise a topic.</p>
        </div>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <FormField id="courseId" label="Course" required error={errors.courseId}>
            <Select
              {...form.field('courseId')}
              onChange={(e) => {
                form.setField('courseId', e.target.value)
                form.setField('topicId', '')
              }}
            >
              <option value="">Select a course</option>
              {courses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.code} · {c.title}
                </option>
              ))}
            </Select>
          </FormField>
          <FormField id="topicId" label="Topic" required error={errors.topicId} hint={!values.courseId ? 'Choose a course to see its topics.' : undefined}>
            <Select {...form.field('topicId')} disabled={!values.courseId}>
              <option value="">{values.courseId ? 'Select a topic' : 'Select a course first'}</option>
              {courseTopics.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </Select>
          </FormField>
        </div>

        <fieldset>
          <legend className="mb-1.5 text-sm font-medium text-slate-700">
            Difficulty<span className="ml-0.5 text-red-500" aria-hidden>*</span>
          </legend>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3" role="radiogroup" aria-describedby={errors.difficulty ? 'difficulty-error' : undefined}>
            {DIFFICULTIES.map((level) => {
              const checked = values.difficulty === level
              return (
                <label
                  key={level}
                  className={cx(
                    'flex cursor-pointer flex-col rounded-xl border px-4 py-3 transition has-[:focus-visible]:ring-4 has-[:focus-visible]:ring-brand-100',
                    checked ? 'border-brand-500 bg-brand-50/60' : 'border-slate-300 hover:border-slate-400',
                    errors.difficulty && !checked && 'border-red-300',
                  )}
                >
                  <input type="radio" name="difficulty" value={level} checked={checked} onChange={() => form.setField('difficulty', level)} className="sr-only" aria-invalid={Boolean(errors.difficulty) || undefined} />
                  <span className={cx('text-sm font-semibold', checked ? 'text-brand-700' : 'text-slate-800')}>{level}</span>
                  <span className="text-xs text-slate-500">{DIFFICULTY_HINTS[level]}</span>
                </label>
              )
            })}
          </div>
          <FieldError id="difficulty-error">{errors.difficulty}</FieldError>
        </fieldset>
      </Card>

      <Card className="space-y-4 p-5 sm:p-6">
        <div>
          <h2 className="text-base font-semibold text-slate-900">
            Attachments <span className="text-sm font-normal text-slate-400">(optional)</span>
          </h2>
          <p className="mt-0.5 text-sm text-slate-500">Add a scan of the original paper, a diagram or a photo of the question.</p>
        </div>
        <AttachmentPicker value={values.attachments} onChange={(next) => form.setField('attachments', next)} error={errors.attachments} disabled={form.submitting} />
      </Card>

      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button variant="secondary" size="lg" onClick={onCancel} disabled={form.submitting}>
          Cancel
        </Button>
        <Button type="submit" size="lg" loading={form.submitting}>
          {submitLabel}
        </Button>
      </div>
    </form>
  )
}

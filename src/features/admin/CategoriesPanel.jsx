import { BookOpen, Pencil, Plus, Tag, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { EmptyState, ErrorState } from '../../components/ui/EmptyState'
import { FormAlert, FormField, Input } from '../../components/ui/Form'
import { ConfirmDialog, Modal } from '../../components/ui/Modal'
import { Skeleton } from '../../components/ui/Spinner'
import { useCourses } from '../../hooks/useCourses'
import { useForm } from '../../hooks/useForm'
import { useToast } from '../../hooks/useToast'
import { categoriesApi, errorMessage } from '../../services/api'
import { pluralize } from '../../utils/format'
import { validateCourse, validateTopic } from '../../utils/validation'

function CourseDialog({ course, onClose, onSaved }) {
  const toast = useToast()
  const form = useForm({ code: course?.code ?? '', title: course?.title ?? '', department: course?.department ?? '' }, validateCourse)
  const submit = form.handleSubmit(async (values) => {
    if (course) await categoriesApi.updateCourse(course.id, values)
    else await categoriesApi.createCourse(values)
    toast.success(course ? 'Course updated' : 'Course created')
    onSaved()
    onClose()
  })

  return (
    <Modal
      open
      onClose={onClose}
      title={course ? 'Edit course' : 'Add course'}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={form.submitting}>Cancel</Button>
          <Button type="submit" form="course-form" loading={form.submitting}>{course ? 'Save changes' : 'Add course'}</Button>
        </>
      }
    >
      <form id="course-form" onSubmit={submit} noValidate className="space-y-4">
        <FormAlert>{form.formError}</FormAlert>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-[10rem_minmax(0,1fr)]">
          <FormField id="course-code" label="Code" required error={form.errors.code}>
            <Input placeholder="COMP 2201" autoFocus {...form.field('code')} />
          </FormField>
          <FormField id="course-title" label="Title" required error={form.errors.title}>
            <Input placeholder="Data Structures & Algorithms" {...form.field('title')} />
          </FormField>
        </div>
        <FormField id="course-dept" label="Department" required error={form.errors.department}>
          <Input placeholder="Computing" {...form.field('department')} />
        </FormField>
      </form>
    </Modal>
  )
}

function TopicDialog({ course, topic, onClose, onSaved }) {
  const toast = useToast()
  const form = useForm({ name: topic?.name ?? '' }, validateTopic)
  const submit = form.handleSubmit(async (values) => {
    if (topic) await categoriesApi.updateTopic(topic.id, values)
    else await categoriesApi.createTopic(course.id, values)
    toast.success(topic ? 'Topic renamed' : 'Topic added', `${course.code} › ${values.name.trim()}`)
    onSaved()
    onClose()
  })

  return (
    <Modal
      open
      onClose={onClose}
      size="sm"
      title={topic ? 'Rename topic' : 'Add topic'}
      description={`${course.code} · ${course.title}`}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={form.submitting}>Cancel</Button>
          <Button type="submit" form="topic-form" loading={form.submitting}>{topic ? 'Save' : 'Add topic'}</Button>
        </>
      }
    >
      <form id="topic-form" onSubmit={submit} noValidate className="space-y-4">
        <FormAlert>{form.formError}</FormAlert>
        <FormField id="topic-name" label="Topic name" required error={form.errors.name}>
          <Input placeholder="e.g. Hash Tables" autoFocus {...form.field('name')} />
        </FormField>
      </form>
    </Modal>
  )
}

export function CategoriesPanel() {
  const toast = useToast()
  const { courses, loading, error, reload } = useCourses()
  const [dialog, setDialog] = useState(null) // { kind: 'course'|'topic', course?, topic? }
  const [pendingDelete, setPendingDelete] = useState(null) // { kind, item, course? }
  const [deleting, setDeleting] = useState(false)

  const remove = async () => {
    setDeleting(true)
    try {
      if (pendingDelete.kind === 'course') await categoriesApi.deleteCourse(pendingDelete.item.id)
      else await categoriesApi.deleteTopic(pendingDelete.item.id)
      toast.success(pendingDelete.kind === 'course' ? 'Course deleted' : 'Topic deleted')
      reload()
    } catch (err) {
      toast.error('Could not delete', errorMessage(err))
    } finally {
      setDeleting(false)
      setPendingDelete(null)
    }
  }

  if (error) return <Card><ErrorState error={error} onRetry={reload} /></Card>

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-slate-500">Questions must belong to a course and one of its topics. Categories that still contain questions cannot be deleted.</p>
        <Button icon={Plus} onClick={() => setDialog({ kind: 'course' })} className="self-start">
          Add course
        </Button>
      </div>

      {loading && !courses.length ? (
        <Skeleton className="h-72 rounded-2xl" />
      ) : courses.length === 0 ? (
        <Card><EmptyState icon={BookOpen} title="No courses yet" description="Add the first course to start organising questions." /></Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {courses.map((course) => (
            <Card key={course.id} className="flex flex-col">
              <div className="flex items-start justify-between gap-3 border-b border-slate-100 px-5 py-4">
                <div className="min-w-0">
                  <p className="text-xs font-semibold tracking-wide text-brand-600">{course.code}</p>
                  <h3 className="font-semibold text-slate-900">{course.title}</h3>
                  <p className="text-xs text-slate-500">
                    {course.department} · {pluralize(course.questionCount, 'question')}
                  </p>
                </div>
                <div className="flex shrink-0">
                  <Button variant="ghost" size="icon" onClick={() => setDialog({ kind: 'course', course })} aria-label={`Edit ${course.code}`}>
                    <Pencil className="size-4" />
                  </Button>
                  <Button variant="dangerGhost" size="icon" onClick={() => setPendingDelete({ kind: 'course', item: course })} aria-label={`Delete ${course.code}`}>
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              </div>
              <ul className="flex-1 divide-y divide-slate-50 px-2 py-2">
                {course.topics.map((topic) => (
                  <li key={topic.id} className="group flex items-center gap-2 rounded-lg px-3 py-1.5 hover:bg-slate-50">
                    <Tag className="size-3.5 text-slate-400" aria-hidden />
                    <span className="flex-1 text-sm text-slate-700">{topic.name}</span>
                    <span className="text-xs text-slate-400 tabular-nums">{topic.questionCount}</span>
                    <span className="flex opacity-100 transition sm:opacity-0 sm:group-focus-within:opacity-100 sm:group-hover:opacity-100">
                      <button type="button" onClick={() => setDialog({ kind: 'topic', course, topic })} className="rounded-md p-1.5 text-slate-400 hover:bg-white hover:text-slate-700" aria-label={`Rename ${topic.name}`}>
                        <Pencil className="size-3.5" />
                      </button>
                      <button type="button" onClick={() => setPendingDelete({ kind: 'topic', item: topic, course })} className="rounded-md p-1.5 text-slate-400 hover:bg-white hover:text-red-600" aria-label={`Delete ${topic.name}`}>
                        <Trash2 className="size-3.5" />
                      </button>
                    </span>
                  </li>
                ))}
                {course.topics.length === 0 && <li className="px-3 py-2 text-sm text-slate-400">No topics yet</li>}
              </ul>
              <div className="border-t border-slate-100 px-3 py-2">
                <Button variant="ghost" size="sm" icon={Plus} onClick={() => setDialog({ kind: 'topic', course })}>
                  Add topic
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {dialog?.kind === 'course' && <CourseDialog course={dialog.course} onClose={() => setDialog(null)} onSaved={reload} />}
      {dialog?.kind === 'topic' && <TopicDialog course={dialog.course} topic={dialog.topic} onClose={() => setDialog(null)} onSaved={reload} />}
      <ConfirmDialog
        open={Boolean(pendingDelete)}
        onClose={() => setPendingDelete(null)}
        onConfirm={remove}
        loading={deleting}
        title={pendingDelete?.kind === 'course' ? `Delete ${pendingDelete.item.code}?` : `Delete “${pendingDelete?.item.name}”?`}
        description={
          pendingDelete?.kind === 'course'
            ? 'The course and all of its topics will be removed. This is only possible when the course has no questions.'
            : 'The topic will be removed. This is only possible when it has no questions.'
        }
        confirmLabel="Delete"
      />
    </div>
  )
}

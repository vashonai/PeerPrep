import { BookOpen } from 'lucide-react'
import { useNavigate, useParams } from 'react-router'
import { ButtonLink } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { EmptyState, ErrorState } from '../components/ui/EmptyState'
import { PageHeader } from '../components/ui/PageHeader'
import { PageSpinner } from '../components/ui/Spinner'
import { AccessDenied } from '../features/auth/RouteGuards'
import { QuestionForm } from '../features/questions/QuestionForm'
import { useAsync } from '../hooks/useAsync'
import { useAuth } from '../hooks/useAuth'
import { useCourses } from '../hooks/useCourses'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import { useToast } from '../hooks/useToast'
import { questionsApi } from '../services/api'

/** Handles both /questions/new and /questions/:id/edit. */
export function QuestionFormPage() {
  const { id } = useParams()
  const isEdit = Boolean(id)
  useDocumentTitle(isEdit ? 'Edit question' : 'Upload question')
  const { user } = useAuth()
  const toast = useToast()
  const navigate = useNavigate()
  const { courses, loading: coursesLoading, error: coursesError, reload } = useCourses()
  const existing = useAsync(() => (isEdit ? questionsApi.getQuestion(id) : Promise.resolve(null)), [id])

  if ((coursesLoading && !courses.length) || existing.loading) return <PageSpinner />
  if (coursesError || existing.error) return <Card><ErrorState error={coursesError ?? existing.error} onRetry={coursesError ? reload : existing.reload} /></Card>
  if (isEdit && existing.data.authorId !== user.id) return <AccessDenied resource="Editing another user’s question" action="question:update" />
  if (!courses.length)
    return (
      <Card>
        <EmptyState icon={BookOpen} title="No courses available yet" description="A Student Administrator needs to add courses and topics before questions can be uploaded." />
      </Card>
    )

  const submit = async (values) => {
    const saved = isEdit ? await questionsApi.updateQuestion(id, values) : await questionsApi.createQuestion(values)
    toast.success(isEdit ? 'Question updated' : 'Question uploaded', isEdit ? undefined : 'Classmates can now find and answer it.')
    navigate(`/questions/${saved.id}`, { replace: isEdit })
  }

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        eyebrow={isEdit ? 'Edit question' : 'New question'}
        title={isEdit ? existing.data.title : 'Upload a past paper question'}
        description={isEdit ? 'Update the details of your question. Answers already posted are kept.' : 'Share a question from a past exam so everyone can discuss and verify the solution.'}
        actions={isEdit && <ButtonLink to={`/questions/${id}`} variant="ghost">View question</ButtonLink>}
      />
      <QuestionForm
        key={id ?? 'new'}
        courses={courses}
        initial={existing.data}
        onSubmit={submit}
        onCancel={() => navigate(isEdit ? `/questions/${id}` : -1)}
        submitLabel={isEdit ? 'Save changes' : 'Upload question'}
      />
    </div>
  )
}

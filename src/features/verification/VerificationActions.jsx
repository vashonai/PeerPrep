import { CircleCheck, CircleX, TriangleAlert } from 'lucide-react'
import { useId, useState } from 'react'
import { VerificationBadge } from '../../components/StatusBadges'
import { Button } from '../../components/ui/Button'
import { FormAlert, FormField, Textarea } from '../../components/ui/Form'
import { Modal } from '../../components/ui/Modal'
import { PERMISSIONS, can } from '../../config/roles'
import { VERIFICATION_LABELS, VERIFICATION_STATUS } from '../../data/models'
import { useAuth } from '../../hooks/useAuth'
import { useToast } from '../../hooks/useToast'
import { errorMessage, verificationApi } from '../../services/api'
import { formatDateTime, fullName } from '../../utils/format'

function VerifyDialog({ answer, status, onClose, onVerified }) {
  const toast = useToast()
  const noteId = useId()
  const [note, setNote] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const isOverride = answer.verificationStatus !== VERIFICATION_STATUS.UNVERIFIED
  const correct = status === VERIFICATION_STATUS.CORRECT

  const submit = async () => {
    setSaving(true)
    setError('')
    try {
      const updated = await verificationApi.verifyAnswer(answer.id, { status, note, confirmOverride: isOverride })
      toast.success(isOverride ? 'Verification overridden' : 'Answer verified', `Marked as ${VERIFICATION_LABELS[status].toLowerCase()}.`)
      onVerified(updated)
      onClose()
    } catch (err) {
      setError(errorMessage(err))
      setSaving(false)
    }
  }

  return (
    <Modal
      open
      onClose={() => !saving && onClose()}
      title={isOverride ? 'Override verification?' : correct ? 'Mark answer as correct' : 'Mark answer as incorrect'}
      description={`Answer by ${fullName(answer.author)}`}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button variant={correct ? 'success' : 'danger'} icon={correct ? CircleCheck : CircleX} loading={saving} onClick={submit}>
            {isOverride ? 'Override decision' : correct ? 'Mark correct' : 'Mark incorrect'}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <FormAlert>{error}</FormAlert>
        {isOverride && (
          <div className="flex gap-3 rounded-xl border border-amber-200 bg-amber-50 p-3.5 text-sm text-amber-900">
            <TriangleAlert className="mt-0.5 size-4 shrink-0 text-amber-600" aria-hidden />
            <div>
              <p>
                This answer is currently <strong>{VERIFICATION_LABELS[answer.verificationStatus]}</strong>
                {answer.reviewer && (
                  <>
                    {' '}by {fullName(answer.reviewer)} on {formatDateTime(answer.verifiedAt)}
                  </>
                )}
                . Your decision will replace it and both will remain in the verification history.
              </p>
            </div>
          </div>
        )}
        <div className="flex items-center gap-2 text-sm text-slate-600">
          New status: <VerificationBadge status={status} />
        </div>
        <FormField id={noteId} label="Feedback for the student" hint="Optional. Shown with the verification badge.">
          <Textarea rows={3} value={note} onChange={(e) => setNote(e.target.value)} maxLength={500} placeholder={correct ? 'What makes this answer complete?' : 'What is wrong, and how can it be fixed?'} />
        </FormField>
      </div>
    </Modal>
  )
}

/**
 * Correct / Incorrect controls for reviewers. Renders nothing for users who
 * cannot verify, and explains why a reviewer cannot verify their own answer.
 */
export function VerificationActions({ answer, onVerified, size = 'sm' }) {
  const { user } = useAuth()
  const [pending, setPending] = useState(null)
  if (!can(user, PERMISSIONS.ANSWER_VERIFY)) return null
  if (answer.authorId === user.id) return <p className="text-xs text-slate-500">You can’t verify your own answer.</p>

  const current = answer.verificationStatus
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button
        size={size}
        variant="secondary"
        icon={CircleCheck}
        className="text-emerald-700 hover:bg-emerald-50 hover:text-emerald-800"
        disabled={current === VERIFICATION_STATUS.CORRECT}
        onClick={() => setPending(VERIFICATION_STATUS.CORRECT)}
      >
        {current === VERIFICATION_STATUS.INCORRECT ? 'Override: correct' : 'Mark correct'}
      </Button>
      <Button
        size={size}
        variant="secondary"
        icon={CircleX}
        className="text-red-700 hover:bg-red-50 hover:text-red-800"
        disabled={current === VERIFICATION_STATUS.INCORRECT}
        onClick={() => setPending(VERIFICATION_STATUS.INCORRECT)}
      >
        {current === VERIFICATION_STATUS.CORRECT ? 'Override: incorrect' : 'Mark incorrect'}
      </Button>
      {pending && <VerifyDialog answer={answer} status={pending} onClose={() => setPending(null)} onVerified={onVerified} />}
    </div>
  )
}

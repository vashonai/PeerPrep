import { ChevronDown, CircleCheck, CircleX, History, Pencil, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { AttachmentList } from '../../components/Attachments'
import { RoleBadge, VerificationBadge } from '../../components/StatusBadges'
import { Avatar } from '../../components/ui/Avatar'
import { Button } from '../../components/ui/Button'
import { ConfirmDialog } from '../../components/ui/Modal'
import { PERMISSIONS, ROLES, can } from '../../config/roles'
import { VERIFICATION_LABELS, VERIFICATION_STATUS } from '../../data/models'
import { useAuth } from '../../hooks/useAuth'
import { useToast } from '../../hooks/useToast'
import { answersApi, errorMessage } from '../../services/api'
import { cx } from '../../utils/cx'
import { formatDateTime, fullName, timeAgo } from '../../utils/format'
import { VerificationActions } from '../verification/VerificationActions'
import { AnswerForm } from './AnswerForm'

const PANEL_STYLES = {
  [VERIFICATION_STATUS.CORRECT]: { className: 'border-emerald-200 bg-emerald-50/70 text-emerald-900', icon: CircleCheck, iconClass: 'text-emerald-600' },
  [VERIFICATION_STATUS.INCORRECT]: { className: 'border-red-200 bg-red-50/70 text-red-900', icon: CircleX, iconClass: 'text-red-600' },
}

function VerificationPanel({ answer }) {
  const style = PANEL_STYLES[answer.verificationStatus]
  if (!style) return null
  const latest = answer.verificationHistory.find((v) => v.kind === 'review')
  const Icon = style.icon
  return (
    <div className={cx('flex gap-3 rounded-xl border p-3.5 text-sm', style.className)}>
      <Icon className={cx('mt-0.5 size-4 shrink-0', style.iconClass)} aria-hidden />
      <div className="min-w-0">
        <p>
          <span className="font-semibold">{VERIFICATION_LABELS[answer.verificationStatus]}</span> by {fullName(answer.reviewer)}
          <span className="opacity-70"> · {formatDateTime(answer.verifiedAt)}</span>
        </p>
        {latest?.note && <p className="mt-1 opacity-90">“{latest.note}”</p>}
      </div>
    </div>
  )
}

function VerificationHistory({ history }) {
  const [open, setOpen] = useState(false)
  if (history.length < 2) return null
  return (
    <div>
      <button type="button" onClick={() => setOpen((v) => !v)} aria-expanded={open} className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-800">
        <History className="size-3.5" aria-hidden />
        Verification history ({history.length})
        <ChevronDown className={cx('size-3.5 transition', open && 'rotate-180')} aria-hidden />
      </button>
      {open && (
        <ol className="mt-2 space-y-2 border-l-2 border-slate-200 pl-4">
          {history.map((record) => (
            <li key={record.id} className="text-xs text-slate-600">
              <div className="flex flex-wrap items-center gap-2">
                <VerificationBadge status={record.status} />
                {record.isOverride && <span className="font-medium text-amber-700">Override</span>}
                <span>
                  {record.kind === 'reset' ? 'Automatic reset' : `by ${fullName(record.reviewer)}`} · {formatDateTime(record.createdAt)}
                </span>
              </div>
              {record.note && <p className="mt-1 text-slate-500">{record.note}</p>}
            </li>
          ))}
        </ol>
      )}
    </div>
  )
}

/** One answer in a discussion thread, with owner, moderator and reviewer actions. */
export function AnswerItem({ answer, onChanged, onDeleted }) {
  const { user } = useAuth()
  const toast = useToast()
  const [editing, setEditing] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const isOwner = user?.id === answer.authorId && can(user, PERMISSIONS.CONTENT_EDIT_OWN)
  const canModerate = !isOwner && can(user, PERMISSIONS.CONTENT_MODERATE)
  const edited = answer.updatedAt !== answer.createdAt

  const save = async (values) => {
    const wasVerified = answer.verificationStatus !== VERIFICATION_STATUS.UNVERIFIED
    const updated = await answersApi.updateAnswer(answer.id, values)
    setEditing(false)
    onChanged(updated)
    toast.success('Answer updated', wasVerified && updated.verificationStatus === VERIFICATION_STATUS.UNVERIFIED ? 'Its verification was reset and it will be reviewed again.' : undefined)
  }

  const remove = async (reason) => {
    setDeleting(true)
    try {
      await answersApi.deleteAnswer(answer.id, { reason })
      toast.success('Answer deleted')
      onDeleted(answer.id)
    } catch (error) {
      toast.error('Could not delete answer', errorMessage(error))
      setDeleting(false)
      setConfirmDelete(false)
    }
  }

  return (
    <article id={`answer-${answer.id}`} className="scroll-mt-24 rounded-2xl border border-slate-200 bg-white p-5 shadow-card target:ring-2 target:ring-brand-300">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <Avatar user={answer.author} size="md" />
          <div>
            <p className="flex flex-wrap items-center gap-2 text-sm font-semibold text-slate-900">
              {fullName(answer.author)}
              {answer.author && answer.author.role !== ROLES.STUDENT && <RoleBadge role={answer.author.role} />}
              {isOwner && <span className="text-xs font-normal text-slate-400">(you)</span>}
            </p>
            <p className="text-xs text-slate-500">
              <time dateTime={answer.createdAt} title={formatDateTime(answer.createdAt)}>
                Answered {timeAgo(answer.createdAt)}
              </time>
              {edited && <span title={formatDateTime(answer.updatedAt)}> · edited</span>}
            </p>
          </div>
        </div>
        <VerificationBadge status={answer.verificationStatus} />
      </header>

      {editing ? (
        <div className="mt-4">
          <AnswerForm initial={answer} onSubmit={save} onCancel={() => setEditing(false)} submitLabel="Save changes" autoFocus />
          {answer.verificationStatus !== VERIFICATION_STATUS.UNVERIFIED && (
            <p className="mt-3 text-xs text-amber-700">Changing the text will reset this answer to Unverified so it can be reviewed again.</p>
          )}
        </div>
      ) : (
        <>
          <div className="mt-4 text-sm leading-relaxed whitespace-pre-wrap text-slate-700">{answer.content}</div>
          {answer.attachments.length > 0 && (
            <div className="mt-4">
              <AttachmentList attachments={answer.attachments} />
            </div>
          )}
          <div className="mt-4 space-y-3">
            <VerificationPanel answer={answer} />
            <VerificationHistory history={answer.verificationHistory} />
          </div>
        </>
      )}

      {!editing && (isOwner || canModerate || can(user, PERMISSIONS.ANSWER_VERIFY)) && (
        <footer className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
          <VerificationActions answer={answer} onVerified={onChanged} />
          <div className="ml-auto flex gap-1">
            {isOwner && (
              <Button variant="ghost" size="sm" icon={Pencil} onClick={() => setEditing(true)}>
                Edit
              </Button>
            )}
            {(isOwner || canModerate) && (
              <Button variant="dangerGhost" size="sm" icon={Trash2} onClick={() => setConfirmDelete(true)}>
                {canModerate ? 'Remove' : 'Delete'}
              </Button>
            )}
          </div>
        </footer>
      )}

      <ConfirmDialog
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        onConfirm={remove}
        loading={deleting}
        title={canModerate ? 'Remove this answer?' : 'Delete your answer?'}
        description={canModerate ? `This permanently removes ${fullName(answer.author)}’s answer. The action is recorded in the moderation log.` : 'This permanently deletes your answer and its verification status.'}
        confirmLabel={canModerate ? 'Remove answer' : 'Delete answer'}
        reasonLabel={canModerate ? 'Reason for removal' : undefined}
        reasonPlaceholder="e.g. Off-topic, copied content, inappropriate language"
      />
    </article>
  )
}

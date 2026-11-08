import { CircleCheck, CircleX, Clock, GraduationCap, ShieldCheck, UserRound } from 'lucide-react'
import { ROLES, ROLE_LABELS } from '../config/roles'
import { VERIFICATION_LABELS, VERIFICATION_STATUS } from '../data/models'
import { Badge } from './ui/Badge'

const VERIFICATION_STYLES = {
  [VERIFICATION_STATUS.UNVERIFIED]: { tone: 'neutral', icon: Clock },
  [VERIFICATION_STATUS.CORRECT]: { tone: 'success', icon: CircleCheck },
  [VERIFICATION_STATUS.INCORRECT]: { tone: 'danger', icon: CircleX },
}

export function VerificationBadge({ status, className }) {
  const { tone, icon } = VERIFICATION_STYLES[status] ?? VERIFICATION_STYLES[VERIFICATION_STATUS.UNVERIFIED]
  return (
    <Badge tone={tone} icon={icon} className={className}>
      {VERIFICATION_LABELS[status]}
    </Badge>
  )
}

const DIFFICULTY_TONES = { Easy: 'teal', Medium: 'warning', Hard: 'danger' }

export function DifficultyBadge({ difficulty }) {
  return <Badge tone={DIFFICULTY_TONES[difficulty]}>{difficulty}</Badge>
}

const ROLE_STYLES = {
  [ROLES.STUDENT]: { tone: 'brand', icon: UserRound },
  [ROLES.LECTURER]: { tone: 'teal', icon: GraduationCap },
  [ROLES.STUDENT_ADMIN]: { tone: 'warning', icon: ShieldCheck },
}

export function RoleBadge({ role, className }) {
  const { tone, icon } = ROLE_STYLES[role] ?? ROLE_STYLES[ROLES.STUDENT]
  return (
    <Badge tone={tone} icon={icon} className={className}>
      {ROLE_LABELS[role]}
    </Badge>
  )
}

export function CourseBadge({ course }) {
  if (!course) return null
  return (
    <Badge tone="brand" title={course.title}>
      {course.code}
    </Badge>
  )
}

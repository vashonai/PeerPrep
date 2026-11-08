import { FolderTree, LayoutGrid, ScrollText, ShieldCheck, UserCog } from 'lucide-react'
import { useSearchParams } from 'react-router'
import { PageHeader } from '../components/ui/PageHeader'
import { Tabs } from '../components/ui/Tabs'
import { PERMISSIONS, can } from '../config/roles'
import { CategoriesPanel } from '../features/admin/CategoriesPanel'
import { LogsPanel } from '../features/admin/LogsPanel'
import { ModerationPanel } from '../features/admin/ModerationPanel'
import { OverviewPanel } from '../features/admin/OverviewPanel'
import { RolesPanel } from '../features/admin/RolesPanel'
import { useAuth } from '../hooks/useAuth'
import { useDocumentTitle } from '../hooks/useDocumentTitle'

const SECTIONS = [
  { id: 'overview', label: 'Overview', icon: LayoutGrid, panel: OverviewPanel, permission: PERMISSIONS.CONTENT_MODERATE },
  { id: 'moderation', label: 'Moderation', icon: ShieldCheck, panel: ModerationPanel, permission: PERMISSIONS.CONTENT_MODERATE },
  { id: 'categories', label: 'Courses & topics', icon: FolderTree, panel: CategoriesPanel, permission: PERMISSIONS.CATEGORY_MANAGE },
  { id: 'roles', label: 'Roles', icon: UserCog, panel: RolesPanel, permission: PERMISSIONS.ROLE_MANAGE },
  { id: 'logs', label: 'Logs', icon: ScrollText, panel: LogsPanel, permission: PERMISSIONS.LOGS_VIEW },
]

export function AdminPage() {
  useDocumentTitle('Administration')
  const { user } = useAuth()
  const [params, setParams] = useSearchParams()
  const sections = SECTIONS.filter((s) => can(user, s.permission))
  const active = sections.find((s) => s.id === params.get('tab')) ?? sections[0]
  const Panel = active.panel

  return (
    <div>
      <PageHeader
        eyebrow="Student Administrator"
        title="Administration"
        description="Moderate content, maintain course categories, manage roles and review audit logs."
      />
      <Tabs
        label="Administration sections"
        className="mb-6"
        value={active.id}
        onChange={(id) => setParams(id === 'overview' ? {} : { tab: id }, { replace: true })}
        tabs={sections.map(({ id, label, icon }) => ({ id, label, icon }))}
      />
      <div role="tabpanel" aria-label={active.label}>
        <Panel />
      </div>
    </div>
  )
}

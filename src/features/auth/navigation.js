import { BadgeCheck, Compass, FilePlus2, FolderOpen, LayoutDashboard, ShieldCheck } from 'lucide-react'
import { PERMISSIONS, can } from '../../config/roles'

const NAV_SECTIONS = [
  {
    label: 'Study',
    items: [
      { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, permission: PERMISSIONS.QUESTION_CREATE },
      { to: '/questions', label: 'Explore questions', icon: Compass, match: (path) => path.startsWith('/questions') && !path.startsWith('/questions/new') },
      { to: '/questions/new', label: 'Upload question', icon: FilePlus2, permission: PERMISSIONS.QUESTION_CREATE },
      { to: '/my-contributions', label: 'My contributions', icon: FolderOpen, permission: PERMISSIONS.CONTENT_EDIT_OWN },
    ],
  },
  {
    label: 'Review & manage',
    items: [
      { to: '/review', label: 'Verification', icon: BadgeCheck, permission: PERMISSIONS.ANSWER_VERIFY },
      { to: '/admin', label: 'Administration', icon: ShieldCheck, permission: PERMISSIONS.CONTENT_MODERATE },
    ],
  },
]

/** Navigation sections filtered to what the user's role can open. */
export function navigationFor(user) {
  return NAV_SECTIONS.map((section) => ({
    ...section,
    items: section.items.filter((item) => !item.permission || can(user, item.permission)),
  })).filter((section) => section.items.length > 0)
}

export function isNavItemActive(item, pathname) {
  return item.match ? item.match(pathname) : pathname === item.to || pathname.startsWith(`${item.to}/`)
}

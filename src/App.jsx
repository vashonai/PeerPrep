import { Outlet, RouterProvider, ScrollRestoration, createBrowserRouter } from 'react-router'
import { PERMISSIONS } from './config/roles'
import { AuthProvider } from './context/AuthProvider'
import { ToastProvider } from './context/ToastProvider'
import { GuestOnly, RequireAuth, RequirePermission } from './features/auth/RouteGuards'
import { AppLayout } from './layouts/AppLayout'
import { AuthLayout } from './layouts/AuthLayout'
import { AdaptiveLayout, PublicLayout } from './layouts/PublicLayout'
import { DashboardPage } from './pages/DashboardPage'
import { ExplorePage } from './pages/ExplorePage'
import { LandingPage } from './pages/LandingPage'
import { LoginPage } from './pages/LoginPage'
import { NotFoundPage } from './pages/NotFoundPage'
import { QuestionDetailPage } from './pages/QuestionDetailPage'
import { PageSpinner } from './components/ui/Spinner'
import { RegisterPage } from './pages/RegisterPage'

function Root() {
  return (
    <ToastProvider>
      <AuthProvider>
        <ScrollRestoration />
        <Outlet />
      </AuthProvider>
    </ToastProvider>
  )
}

const P = PERMISSIONS

// Role-specific pages load on demand to keep the initial bundle small.
const page = (load, name) => () => load().then((module) => ({ Component: module[name] }))
const QuestionForm = page(() => import('./pages/QuestionFormPage'), 'QuestionFormPage')
const MyContributions = page(() => import('./pages/MyContributionsPage'), 'MyContributionsPage')
const Review = page(() => import('./pages/ReviewPage'), 'ReviewPage')
const Admin = page(() => import('./pages/AdminPage'), 'AdminPage')

const router = createBrowserRouter([
  {
    element: <Root />,
    hydrateFallbackElement: <PageSpinner />,
    children: [
      { element: <PublicLayout />, children: [{ index: true, element: <LandingPage /> }] },
      {
        element: <GuestOnly />,
        children: [
          {
            element: <AuthLayout />,
            children: [
              { path: 'login', element: <LoginPage /> },
              { path: 'register', element: <RegisterPage /> },
            ],
          },
        ],
      },
      // Browsing is public; signed-in users see it inside the app shell.
      {
        element: <AdaptiveLayout />,
        children: [
          { path: 'questions', element: <ExplorePage /> },
          { path: 'questions/:id', element: <QuestionDetailPage /> },
        ],
      },
      {
        element: <RequireAuth />,
        children: [
          {
            element: <AppLayout />,
            children: [
              {
                element: <RequirePermission permission={P.QUESTION_CREATE} resource="Student dashboard" />,
                children: [
                  { path: 'dashboard', element: <DashboardPage /> },
                  { path: 'questions/new', lazy: QuestionForm },
                ],
              },
              {
                element: <RequirePermission permission={P.CONTENT_EDIT_OWN} resource="My contributions" />,
                children: [
                  { path: 'questions/:id/edit', lazy: QuestionForm },
                  { path: 'my-contributions', lazy: MyContributions },
                ],
              },
              {
                element: <RequirePermission permission={P.ANSWER_VERIFY} resource="Verification dashboard" />,
                children: [{ path: 'review', lazy: Review }],
              },
              {
                element: <RequirePermission permission={P.CONTENT_MODERATE} resource="Administration dashboard" />,
                children: [{ path: 'admin', lazy: Admin }],
              },
            ],
          },
        ],
      },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
])

export default function App() {
  return <RouterProvider router={router} />
}

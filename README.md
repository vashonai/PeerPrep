# PeerPrep

A collaborative past paper discussion platform for university students. Students upload past exam questions, organise them by course and topic, discuss answers, and see which answers lecturers or student administrators have verified.

This is the **frontend MVP**. It runs entirely in the browser against a mock data layer that can be replaced by a real backend without changing the UI.

## Getting started

```bash
npm install
npm run dev       # http://localhost:5173
npm run build     # production build into dist/
npm run lint      # oxlint
```

## Demo accounts

Demo mode is on by default. On the login page, choose **Try a demo account** or sign in manually:

| Role | Email | Password |
|---|---|---|
| Student | student@peerprep.demo | Demo123! |
| Lecturer | lecturer@peerprep.demo | Demo123! |
| Student Administrator | admin@peerprep.demo | Demo123! |

These are **public test credentials**. They exist only while `VITE_DEMO_MODE` is not `false`. Demo account roles cannot be changed, so every role stays testable.

Data you create is saved in this browser's localStorage. To restore the original sample data, open the user menu and choose **Reset demo data**.

> **Security notice:** In the prototype, all checks run in the browser, so they demonstrate behaviour but provide no real security. Production needs server-side authentication and authorization (see below).

## Architecture

```
src/
  config/       roles.js (roles + central permission table), env.js
  data/         models.js (domain constants and typedefs), seed.js (sample data)
  services/     api.js: the only data-access entry point for the UI
    mock/       in-browser "server": auth, questions, answers, verification,
                categories, admin; localStorage db; sessionStorage session
  context/      AuthProvider (session + 60-min inactivity timeout), ToastProvider
  hooks/        useAuth, useAsync, useForm, useCourses, …
  components/   shared UI (ui/ = design-system primitives)
  features/     auth, questions, answers, verification, admin
  layouts/      PublicLayout, AuthLayout, AppLayout (role-aware sidebar)
  pages/        one component per route
  utils/        validation (shared by forms and services), files, search, format
```

- **Permissions** are declared once in `src/config/roles.js`. Navigation, route guards, buttons and the mock services all check the same table. The service layer re-checks every operation and logs denied attempts. Hiding a button is never the only protection.
- **Swapping in a backend:** reimplement the modules exported from `src/services/api.js` with HTTP calls that keep the same function names and return shapes. Pages and hooks do not change. The comments in `api.js` list the matching REST endpoints.
- **Verification history** is stored as separate append-only `VerificationRecord`s. Each answer also carries its current status, the reviewer and a timestamp. Editing a verified answer resets it to Unverified and records the reset.

## Backend requirements (Phase 3)

The prototype is designed for, but does not implement, the following:

- bcrypt/argon2 password hashing (the prototype uses PBKDF2 via Web Crypto for registered accounts and never stores plaintext)
- HttpOnly secure session cookies over HTTPS, with a server-enforced 60-minute idle timeout
- server-side role-based authorization, plus logging of unauthorized administrative actions
- object storage for attachments, with server-side type and size validation (the prototype stores files of 2 MB or less as data URLs)
- indexed full-text search

The specification's targets of 3-second search responses and 500 concurrent users need the backend and load testing; the frontend prototype does not demonstrate them.

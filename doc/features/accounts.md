# Accounts

- Pages: `/register`, `/login` (`src/components/AuthForm.tsx`). Signed-in users are redirected to `/dashboard`; `?next=` only accepts same-site paths.
- APIs: `POST /api/auth/register` (name, email, password ≥ 8), `POST /api/auth/login`, `POST /api/auth/logout`.
- Emails are lowercased; duplicate email → `409 EMAIL_TAKEN`. Wrong email or password both return `401 INVALID_CREDENTIALS`, with equal bcrypt work so timing doesn't reveal which.
- Blocked accounts get `403 ACCOUNT_BLOCKED` at login and lose existing sessions immediately.
- Limits: 5 registrations/hour per IP; 20 logins/15 min per IP and 10 per email.
- Admins are promoted with `npm run make-admin -- <email>`; there is no UI for granting the role.
- Not yet built: email verification and password reset.

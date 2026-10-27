# Admin moderation

- Page: `/admin` (404 for non-admins). Tabs for links and users, with search (code, URL, title, owner email / name, email) and platform totals (users, links, clicks in the last 24h).
- `PATCH /api/admin/links/[id]` `{ isBlocked, blockedReason? }`: blocks or unblocks any link. Blocked links redirect to `/link-unavailable?reason=blocked`.
- `PATCH /api/admin/users/[id]` `{ isBlocked }`: suspends a user, signs them out, and blocks their links with reason `USER_BLOCKED`. Unblocking restores only those links; links an admin blocked individually stay blocked. Admins can't block themselves.
- Admins can open any link's stats page from the links tab.

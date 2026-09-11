# Finish visitor and admin experience

## What will change
- Add a **Content & support** area in the admin dashboard for homepage FAQs, Terms, Privacy, Cookies, support introduction, public support email, and a private notification email.
- Keep visitor-facing language focused on browsing, downloading, requesting, and support; remove admin/editor links and labels that visitors do not need.
- Pin announcements above the Library section in the expanded sidebar, retain announcement access in the collapsed sidebar, and add a clear notification button on mobile.
- Restore a neutral charcoal dark palette while preserving the existing light theme and semantic colors.
- Complete and verify the unfinished editable FAQ/legal/support displays.

## Email delivery
- Store the private notification address without displaying it publicly.
- Keep submitted requests visible in the admin Messages area. Automatic email delivery requires a connected email service; if one is already available, wire it securely without exposing the address.

## Verification
- Check all changed pages on desktop and mobile, including admin editing, sidebar placement, notifications, homepage FAQ, legal pages, and support.
- Resolve current build/runtime errors and confirm the relevant flows in the live preview.
- Provide a Vercel deployment checklist covering the required environment variable names, persistent backend data, and the admin-password behavior.

## Technical details
- Continue using the existing `site_settings` record and signed admin server functions.
- Do not expose backend service credentials in browser code or commit them to the repository.
- Preserve existing visitor access and database security policies.

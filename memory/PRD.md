# PRD — Parohia Ortodoxă Română „Sfântul Ierarh Nicolae" din Sigmir

## Problem Statement
Premium trilingual (RO/DE/EN) website for the Romanian Orthodox parish in Sigmir, Bistrița-Năsăud. Byzantine-Orthodox aesthetic, sober/warm/pastoral. WordPress-friendly structure. Donation + WhatsApp pastoral contact. Admin CMS.

## Stack
FastAPI + React (framer-motion, lenis) + MongoDB. Auth: JWT httpOnly cookie.

## User Personas
- Parishioners & elderly community (large fonts, clear nav)
- Diaspora (DE/EN)
- Donors
- Admin (priest/volunteers) managing content

## Implemented (2026-07-14)
- Trilingual i18n RO/DE/EN (src/i18n.js), language switcher persisted in localStorage
- Award-level Home: kinetic hero (church sketch parallax, line reveal), marquee, numbered teaser chapters, WhatsApp CTA
- Pages: Despre (Istoric, Comunitate), Revistă, Anunțuri (+detail), Renovare (gallery + support), Resurse hub, Calendar ortodox (external API), Hram, Cuvântul Preotului, Catehizare, Rugăciuni, Contact (map + form + WhatsApp), Donează (IBAN + external)
- Orthodox calendar via external orthocal.info API (backend proxy /api/calendar/{y}/{m}/{d})
- Donation: internal IBAN page + external link; Donate buttons in header/hero/footer; toggleable from admin
- WhatsApp pastoral contact (40787867540): float button + contact + home
- Admin CMS (/admin): tabs for Anunțuri, Revistă, Resurse (categorized), Renovare gallery, Mesaje, Setări; multilingual content editor
- Backend content CRUD, settings, contact messages, auth (bcrypt + JWT cookie), idempotent admin seed + sample content
- Tested: backend 100%, frontend 100% (iteration_1)

## Admin
admin@parohiasigmir.ro / Sigmir2025! (see test_credentials.md)

## Backlog (next)
- P1: Real photos of Sigmir church (client to provide) replacing placeholders
- P1: Dynamic Hramul page section with feast-day program
- P2: Newsletter signup / email notifications (Resend)
- P2: Brute-force login lockout
- P2: Restrict CORS_ORIGINS to explicit frontend URL
- P2: WordPress export/implementation guide document (CPT/ACF mapping already reflected in data model)

## Update (2026-07-14) — Stripe Donations
- Integrated Stripe Checkout (emergentintegrations, key sk_test_emergent) for online donations in RON.
- Preset server-side packages: seed=50, candle=100, brick=250, pillar=500 RON + custom (5..50000).
- Endpoints: POST /api/donations/checkout, GET /api/donations/status/{id}, POST /api/webhook/stripe, GET /api/donations/packages. Collection: payment_transactions.
- Frontend /doneaza: Stripe card panel (presets + custom) with return polling + status banner; bank IBAN card retained.
- Security verified: amounts resolved server-side only; frontend never sends amount. Tested 100% (iteration_2).

## Update (2026-07-14) — Email mulțumire donator (Resend)
- Integrated Emergent-managed Resend email. Env: EMERGENT_EMAIL_KEY, EMAIL_FROM_NAME.
- On successful donation (payment_status='paid') backend sends a Romanian HTML thank-you email to donor (idempotent via email_sent flag), triggered from /api/donations/status and /api/webhook/stripe.
- Donate form now collects optional donor name + email; passed to Stripe metadata.
- Email proxy verified working (returns message id). No regression in donation flow.

## Update (2026-07-14) — Newsletter + Super-admin editable content
- Newsletter subpage /resurse/newsletter (Ziarul Lumina + Revista Renașterea links) with Resend subscribe + welcome email.
- Endpoints: /api/newsletter/subscribe, /subscribers (auth), /broadcast (auth). Collection newsletter_subscribers.
- Super-admin editable content: /api/pages GET (public), /api/pages/{key} PUT (auth). SiteContentContext overrides i18n on Home + History (texts + images). Admin 'Pagini' tab.
- Donation amounts editable: settings.donation_packages drives /api/donations/packages and checkout (server-side). Admin Settings packages editor.
- Admin new tabs: Pagini, Newsletter. Tested 100% (iteration_3).

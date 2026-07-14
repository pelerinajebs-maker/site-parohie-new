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

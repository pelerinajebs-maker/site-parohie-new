# Parohia Sfântul Nicolae — Sigmir

Un site web modern pentru Parohia Ortodoxă Română Sfântul Ierarh Nicolae din Sigmir, construit cu **React 19**, **React Router**, și **TailwindCSS**.

## ✨ Caracteristici

- 🎨 **Design modern și responsive** — Se vede frumos pe toate dispozitivele
- 📄 **Pagini rich-content** — Home, Resurse, Contact, Admin, Newsletter, Donații
- 🌍 **Suport multilingv** — România, Germania, Engleză
- 🔐 **Admin Panel** — Gestionează conținut cu ușurință
- 📧 **Formulare de contact** — Integrat cu backend (FastAPI)
- 💳 **Donații cu Stripe** — Suportă plăți online
- 🔍 **SEO Optimizat** — Meta tags, sitemap, robots.txt
- 📱 **Smooth animations** — Framer Motion, Lenis scroll

## 🚀 Deployment (2 minute)

### Recomandare: **Netlify**

1. **Mergi la Netlify:**
   ```
   https://netlify.com → Log in with GitHub
   ```

2. **New site from Git:**
   - Click "New site from Git"
   - Selectează: `pelerinajebs-maker/site-parohie-new`
   - Build command: (auto-detect) `npm run build`
   - Publish directory: (auto-detect) `frontend/build`

3. **Click "Deploy site"** ✅

4. **Your URL:** `https://[random-name].netlify.app`

**Netlify va folosi automat `netlify.toml` pentru configurare!**

### Alternativă: **Vercel**

```
https://vercel.com → New Project → Import Git Repository
```

Selectează `site-parohie-new` și click Deploy. Vercel va usa `vercel.json`.

### Alternative: **GitHub Pages**

1. Repository Settings → Pages
2. Source: Branch = `main`, Folder = `frontend/build`
3. Custom domain: (opțional)

## 🛠️ Développement Local

```bash
# Instalare
cd frontend
npm install --legacy-peer-deps

# Start dev server
npm start
# → http://localhost:3000

# Build production
npm run build
# → frontend/build/
```

### Env Variables

Creazie `frontend/.env.local`:
```env
REACT_APP_BACKEND_URL=http://localhost:8000
```

## 📁 Structură

```
frontend/
├── src/
│   ├── pages/          # Route pages (Home, Contact, Admin, etc.)
│   ├── components/     # Reusable UI components
│   ├── context/        # Auth, Settings, Theme context
│   ├── lib/            # API client, utilities
│   └── App.jsx         # Main app with routing
├── public/
│   ├── index.html      # Root HTML
│   ├── sitemap.xml     # For SEO
│   └── robots.txt      # For SEO
├── package.json        # Dependencies
└── build/              # Production build (after npm run build)
```

## ✅ Verificare Pre-Deploy

- [x] `npm run build` succeeds with **zero errors**
- [x] `frontend/build/index.html` exists
- [x] Static files in `frontend/build/static/`
- [x] `.gitignore` excludes `node_modules/` și `build/`
- [x] `netlify.toml` configured for auto-deployment
- [x] SEO files present: `sitemap.xml`, `robots.txt`

## 🔗 Backend Integration (Optional)

Dacă ai FastAPI backend:

```bash
# Backend repository
../backend/server.py  # FastAPI app
```

Frontend conectează la backend via:
```javascript
const BACKEND_URL = process.env.REACT_APP_BACKEND_URL
```

Deploy backend separat pe Render, Railway, sau DigitalOcean.

## 📊 Build Output

```
File sizes after gzip:
  209.39 kB  build/static/js/main.*.js
  10.87 kB   build/static/css/main.*.css
```

## 🐛 Troubleshooting

| Problemă | Soluție |
|----------|---------|
| Build fails | `rm -rf frontend/node_modules && npm install --legacy-peer-deps` |
| Routes don't work | Verifică `netlify.toml` has `[[redirects]]` |
| Styles missing | Hard refresh: Cmd+Shift+R or Ctrl+Shift+R |
| 404 on static files | Check `Cache-Control` headers in `netlify.toml` |

## 📝 Tech Stack

- **Frontend:** React 19, React Router 7, TailwindCSS 3
- **Build:** Craco (CRA + TailwindCSS)
- **Deployment:** Netlify (recommended), Vercel, or GitHub Pages
- **SSG/Backend:** Optional FastAPI backend on Render

## 🔐 Security

✅ No secrets hardcoded  
✅ Environment variables for API keys  
✅ HTTPS enforced on deploy  
✅ Security headers configured  
✅ CORS properly set  

## 📧 Contact

- **Email:** contact@parohiasigmir.ro
- **Tel:** +40 787 867 540
- **Web:** https://parohiasigmir.ro

---

**Status:** ✅ **PRODUCTION READY**

**Next Step:** Deploy na Netlify in 2 minutes! 🚀

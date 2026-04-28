# 🔥 TURNUP — Kenyan Campus Student Hub

The exclusive dating & social SaaS for Thika Road campus students.  
Built with React + TypeScript + Supabase + Netlify Functions + M-Pesa Daraja API.

---

## 🚀 DEPLOY IN 5 STEPS

### Step 1 — Set up Supabase

1. Go to [supabase.com](https://supabase.com) → New Project
2. Give it a name (e.g. `turnup-prod`) and set a database password
3. Once created, go to **SQL Editor** → paste the entire contents of `supabase-schema.sql` → Run
4. Go to **Settings → API** and copy:
   - `Project URL` → this is your `VITE_SUPABASE_URL`
   - `anon public` key → this is your `VITE_SUPABASE_ANON_KEY`
   - `service_role` key → this is your `SUPABASE_SERVICE_ROLE_KEY`

### Step 2 — Set up M-Pesa Daraja (optional for now)

1. Go to [developer.safaricom.co.ke](https://developer.safaricom.co.ke)
2. Create an app → get Consumer Key & Consumer Secret
3. Use **sandbox** credentials for testing first
4. Your callback URL will be: `https://your-netlify-site.netlify.app/api/mpesa-callback`

### Step 3 — Deploy to Netlify

**Option A: Via GitHub (recommended)**
1. Push this folder to a GitHub repo
2. Go to [netlify.com](https://netlify.com) → Add new site → Import from GitHub
3. Build settings are auto-detected from `netlify.toml`
4. Add your environment variables (see Step 4)
5. Deploy!

**Option B: Drag & Drop**
1. Run `npm install && npm run build` locally
2. Drag the `dist` folder to [app.netlify.com/drop](https://app.netlify.com/drop)
3. Note: Netlify Functions won't work with drag & drop — use Option A for full backend

### Step 4 — Add Environment Variables in Netlify

Go to **Site Settings → Environment Variables → Add variable** for each:

```
VITE_SUPABASE_URL          = https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY     = eyJxxx...
SUPABASE_URL               = https://xxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY  = eyJxxx...
MPESA_CONSUMER_KEY         = xxx
MPESA_CONSUMER_SECRET      = xxx
MPESA_SHORTCODE            = 174379
MPESA_PASSKEY              = xxx
MPESA_CALLBACK_URL         = https://your-site.netlify.app/api/mpesa-callback
```

### Step 5 — Go Live!

Trigger a redeploy after adding env vars. Your site is live! 🎉

---

## 🛠 LOCAL DEVELOPMENT

```bash
# Install dependencies
npm install

# Install Netlify CLI (needed for local functions)
npm install -g netlify-cli

# Copy env file
cp .env.example .env.local
# Fill in your Supabase values in .env.local

# Start local dev (React + Netlify Functions)
netlify dev

# Or just the frontend
npm run dev
```

---

## 📁 PROJECT STRUCTURE

```
turnup/
├── netlify/
│   └── functions/
│       ├── mpesa-stk-push.js      ← M-Pesa STK push endpoint
│       └── mpesa-callback.js      ← M-Pesa payment confirmation
├── src/
│   ├── sections/
│   │   ├── Landing.tsx            ← Landing/home page
│   │   ├── Navigation.tsx         ← Top nav
│   │   ├── AuthPage.tsx           ← Sign in / Sign up
│   │   ├── Onboarding.tsx         ← Profile creation wizard
│   │   ├── Discover.tsx           ← Swipe/match page
│   │   ├── Messages.tsx           ← Chat with matches
│   │   ├── Events.tsx             ← Campus events
│   │   ├── Profile.tsx            ← User profile & settings
│   │   └── Pricing.tsx            ← Plans + M-Pesa payment
│   ├── lib/
│   │   ├── supabase.ts            ← Supabase client + types
│   │   └── store.ts               ← Zustand auth store
│   ├── App.tsx                    ← Routes + auth init
│   ├── main.tsx                   ← Entry point
│   └── index.css                  ← Global styles + Tailwind
├── supabase-schema.sql            ← Run this in Supabase SQL editor
├── .env.example                   ← Copy to .env.local
├── netlify.toml                   ← Netlify build config
├── tailwind.config.js
├── vite.config.ts
└── package.json
```

---

## 🔌 API ENDPOINTS

| Endpoint | Method | Description |
|---|---|---|
| `POST /api/mpesa-stk-push` | POST | Trigger M-Pesa STK push |
| `POST /api/mpesa-callback` | POST | M-Pesa payment callback (called by Safaricom) |

---

## 🔒 FEATURES

- ✅ Email/password auth via Supabase
- ✅ Multi-step onboarding wizard
- ✅ Swipe / like / superlike / pass
- ✅ Mutual match detection
- ✅ Real-time chat (Supabase Realtime)
- ✅ Campus events with join/leave
- ✅ Premium plans (Free / Weekly / Monthly)
- ✅ M-Pesa Daraja STK Push integration
- ✅ Profile editing
- ✅ Campus & category filters
- ✅ Mobile responsive

---

## 🌍 CAMPUSES SUPPORTED

MKU, JKUAT, Kenyatta University, Zetech, KCA, KMTC Thika, Thika Technical, Imperial Medical, Gresta, Thika Health Sciences, Jordan College

---

## 📞 M-PESA GOING LIVE

When ready for production M-Pesa:
1. Apply for go-live on Safaricom developer portal
2. Replace `sandbox.safaricom.co.ke` with `api.safaricom.co.ke` in `mpesa-stk-push.js`
3. Update your live shortcode and passkey
4. Set `MPESA_CALLBACK_URL` to your live Netlify URL

---

Built with ❤️ for Thika Road campus students. Kenya represent! 🇰🇪

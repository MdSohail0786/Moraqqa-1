# MORAQQA — Luxury Interior Architecture & Design Studio

A full-stack MERN website and admin panel built for a studio with a **1000+ image library**.
Images live in **Cloudinary**, metadata in **MongoDB**, and the React app only ever requests the pages of images it needs.

## Features

- Cinematic home page: parallax hero, optional video, tasteful WebGL wireframe (desktop only), word-by-word reveals
- Dynamic project pages (`/projects/:slug`) and category pages (`/projects/residential`) from MongoDB
- Multi-select project filters (category, style, location, year, room, type) backed by `GET /api/projects`
- Gallery: masonry, **18 images per page**, infinite scroll + "Load more", full-screen lightbox (zoom, swipe, keyboard, counter)
- Before / after slider, related projects, services, collections, journal, global debounced search
- Contact form → MongoDB, floating WhatsApp button, newsletter
- Admin (`/admin`): dashboard, projects (publish / feature), image library (batch upload, bulk edit), **drag-and-drop gallery ordering saved to MongoDB**, categories, collections, services, journal, enquiries (status, notes, read / unread), settings (logo, hero, social links, team)
- Security: JWT, bcrypt, Helmet, CORS allow-list, rate limiting, request validation, input sanitising
- SEO: per-page titles, meta, Open Graph / Twitter, canonical URLs, JSON-LD, `sitemap.xml`, `robots.txt`
- Accessibility: semantic HTML, focus states, ESC to close dialogs, focus trap in lightbox, `prefers-reduced-motion`

## Tech stack

React 18 · Vite · React Router · Context API · Axios · Framer Motion · Three.js / React Three Fiber · Lenis · dnd-kit · Lucide ·
Node · Express · Mongoose · JWT · bcryptjs · Multer (memory only) · sharp (validation) · Cloudinary SDK · Helmet · express-validator.

## Architecture

```
Cloudinary (files, folders) ─┐
                             ├─ MongoDB (metadata, order, URLs, public IDs)
Express REST API ────────────┘            ▲
        ▲                                 │ paginated, filtered queries
React app (Cloudinary-transformed URLs: f_auto, q_auto, w_*, dpr_auto)
```

Upload flow: admin selects images → client validates type / size / dimensions → sent 4 at a time (multipart) → server re-validates the real file content with `sharp` → uploads to Cloudinary (3 at a time) → stores URL + public ID in MongoDB → per-file success / failure is reported.

Cloudinary folders: `moraqqa/projects/<project-slug>`, `moraqqa/<category-slug>`, `moraqqa/collections/<slug>`, `moraqqa/site/...`.

## Folder structure

```
moraqqa/
├── package.json            root scripts (dev, seed, build)
├── backend/
│   ├── server.js
│   └── src/
│       ├── app.js
│       ├── config/         env, db, cloudinary
│       ├── controllers/
│       ├── middlewares/    auth, validate, sanitize, upload, rate limits, errors
│       ├── models/         User Project Image Category Collection Service Enquiry Article Setting Subscriber
│       ├── routes/
│       ├── services/       cloudinaryService
│       ├── utils/          helpers, seed
│       └── validators/
└── frontend/
    └── src/
        ├── admin/          admin layout, pages, components
        ├── components/     Navbar, Gallery, Lightbox, CloudImage, Cursor, ...
        ├── config/         static config (nav links, form options)
        ├── context/        Settings, Auth, Toast, Layout
        ├── hooks/
        ├── layouts/
        ├── pages/
        ├── services/       axios client + endpoints
        ├── styles/         tokens.css holds the palette and type
        └── utils/          cloudinary URL helpers
```

## Environment variables

`backend/.env` (copy `backend/.env.example`):

| Variable | Purpose |
|---|---|
| `PORT` | API port (default 5000) |
| `MONGODB_URI` | MongoDB connection string |
| `JWT_SECRET` | Long random string (≥32 chars in production) |
| `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` | Cloudinary credentials (server only) |
| `ADMIN_EMAIL`, `ADMIN_PASSWORD` | Admin created by `npm run seed` |
| `WHATSAPP_NUMBER` | Digits with country code, e.g. `919876543210` |
| `CLIENT_URL` | Allowed frontend origin(s), comma separated |
| `SITE_URL` | Public site URL for `sitemap.xml` |

`frontend/.env` (copy `frontend/.env.example`): `VITE_API_URL`, `VITE_SITE_URL`.

## Setup

**MongoDB** — local `mongod`, or create a free cluster on MongoDB Atlas and paste its connection string into `MONGODB_URI` (allow your IP in Atlas Network Access).

**Cloudinary** — create an account, then copy Cloud name, API key and API secret from the dashboard into `backend/.env`.

**Run locally**

```bash
cd moraqqa
npm run install:all
cp backend/.env.example backend/.env      # then edit values
cp frontend/.env.example frontend/.env
npm run seed                              # admin user, categories, services, sample projects
npm run dev                               # API :5000, site :5173
```

Open http://localhost:5173 and sign in at http://localhost:5173/admin/login with `ADMIN_EMAIL` / `ADMIN_PASSWORD`. Change the password in **Admin → Settings**.

The seed uses a few Cloudinary *demo* placeholder images for development only. Delete the sample projects and upload real work in the admin.

## Managing the 1000+ images

1. **Admin → Categories**: create types (Residential…), styles (Modern…) and rooms (Bedroom…). Slugs become URLs.
2. **Admin → Projects → New**: fill in the details, save, then upload the gallery on the same page. Drag the grip handle to reorder; the public gallery follows that order. Use the picture icon to choose the cover.
3. **Admin → Images**: bulk-upload to a project / category / collection; filter, search, multi-select to re-assign, feature or delete. Max 15 MB each; JPG, PNG, WEBP; min 400×300.
4. Publish the project (and tick *Featured* to show it on the home page).

Only the first 18 images load per gallery page, more as the visitor scrolls. The lightbox requests a full-size (device-width, capped at 2400px) image only for the image being viewed.

## API

`/api` prefix. `🔒` = admin token required (`Authorization: Bearer <jwt>`).

| Method & path | Notes |
|---|---|
| `POST /auth/login` · `GET /auth/me` 🔒 · `POST /auth/logout` · `PUT /auth/password` 🔒 | |
| `GET /projects` | `category, style, location, year, roomType, projectType, featured, q, sort, page, limit` (comma separated for multiple) |
| `GET /projects/filters` · `GET /projects/:slug` · `GET /projects/:slug/related` | |
| `POST /projects` 🔒 · `PUT /projects/:id` 🔒 · `DELETE /projects/:id` 🔒 | `?deleteImages=true` also removes the files |
| `GET /images` | `category, project, collection, tag, featured, q, page, limit` (≤60) |
| `POST /images/upload` 🔒 | multipart, field `images`, optional `project, category, collection, tags, featured` |
| `PUT /images/:id` 🔒 · `PUT /images/bulk` 🔒 · `PUT /images/reorder` 🔒 · `DELETE /images/:id` 🔒 · `POST /images/bulk-delete` 🔒 | |
| `GET/POST/PUT/DELETE /categories`, `/collections`, `/services`, `/journal` | `PUT .../reorder` for ordering; writes require 🔒 |
| `GET /enquiries` 🔒 · `PUT /enquiries/:id` 🔒 · `DELETE /enquiries/:id` 🔒 · `POST /enquiries` | public POST is rate limited |
| `POST /newsletter` · `GET /newsletter` 🔒 | |
| `GET /search?q=` | projects, categories, services, collections, articles |
| `GET /settings` · `PUT /settings` 🔒 · `POST /media/upload` 🔒 · `GET /stats` 🔒 · `GET /sitemap.xml` | |

## Deployment

**Database** — MongoDB Atlas. **Images** — Cloudinary.

**Backend (Render / Railway / VPS)** — root directory `backend`, build `npm install`, start `npm start`. Set every variable from the table above; set `NODE_ENV=production`, `CLIENT_URL=https://your-site.com`, `SITE_URL=https://your-site.com`. Run `npm run seed` once (e.g. from the provider's shell) to create the admin.

**Frontend (Vercel / Netlify)** — root directory `frontend`, build `npm run build`, output `dist`. Set `VITE_API_URL=https://your-api.example.com/api` and `VITE_SITE_URL=https://your-site.com`. `vercel.json` / `netlify.toml` already rewrite all routes to `index.html`; replace `YOUR-API-HOST` there so `/sitemap.xml` is proxied to the API, and update the domain in `public/robots.txt`.

## Notes and trade-offs

- The admin token is kept in `localStorage` and sent as a Bearer header (cookies are not used for auth, so there is no CSRF surface). Keep a strict CSP and avoid third-party scripts on the admin.
- The legal pages (`/privacy`, `/terms`) are starter text: have them reviewed before launch.
- `npm audit` should be run before deployment as dependency advisories change over time.

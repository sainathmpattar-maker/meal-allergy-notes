# MealAllergy Notes

A restricted-access meal planning and attendee preference management tool designed for event organisers.

Event organisers frequently struggle to coordinate dietary preferences and allergy notes across registrations. **MealAllergy Notes** solves this by providing a unified workflow: attendees securely declare their dietary preferences, allergies, and notes; organisers plan meals with ingredient lists; and an automated conflict engine scans for potential allergen-ingredient conflicts to flag them for **human verification**.

> ⚠️ **CRITICAL SAFETY NOTICE:**
> The conflict detection engine is an **automated flagging aid**, NOT a safety guarantee. The application **never declares a meal safe**. It only surfaces potential matches and synonym associations for human review. Event organisers and kitchen staff must independently verify ingredients and preparation procedures before serving attendees with allergies.

---

## Features

- **Role-Based Access Control**:
  - **Organisers**: Full event management, meal menu planning with ingredient chips, view all attendee registrations, and run/review automated allergy conflict flags.
  - **Attendees**: Can only view and edit their own meal preferences and see event meal names/descriptions. Cannot see other attendees' personal data, allergies, or notes.
- **Automated Conflict Detection Engine**:
  - Two-way synonym expansion (e.g. `peanut` expands to `groundnut`, `satay`; `dairy` expands to `paneer`, `butter`, `ghee`, `whey`, etc.).
  - Word-aware boundary matching to eliminate false positives (e.g. `milk` does NOT trigger on `milkshake`).
  - Automated rescans triggered whenever a meal's ingredients or an attendee's allergies change.
  - Status lifecycle for flags: `pending` → `verified` or `dismissed`, recording who reviewed and when.
- **Responsive Mobile-First UI**:
  - Full support for 375px (mobile), 768px (tablet), and 1280px+ (desktop).
  - Responsive tables that collapse into clean stacked cards on mobile screens (`< 640px`).
  - Interactive allergy chips with auto-suggestions and quick-add pills.
  - Character counter for detailed allergy notes (max 500 characters).
  - Toast notifications, confirmation modals on destructive actions, and empty states.
- **Production-Ready Security**:
  - Passwords hashed with bcrypt (salt rounds: 12).
  - JWT authentication (7-day validity).
  - HTTP security headers with `helmet`.
  - Rate limiting on authentication endpoints (`express-rate-limit`).
  - NoSQL injection prevention with `express-mongo-sanitize`.
  - Centralised error handling with field-level validation errors via `express-validator`.
  - Single-service deployment: Express serves production React build and handles client routing.

---

## Tech Stack

- **Backend**: Node.js, Express (REST API, CommonJS), Mongoose (MongoDB ODM)
- **Frontend**: React 18, Vite, React Router v6, Axios, custom modern CSS with CSS variables
- **Validation & Security**: `express-validator`, `bcryptjs`, `jsonwebtoken`, `helmet`, `express-rate-limit`, `express-mongo-sanitize`
- **Testing**: Jest unit tests for the conflict detection engine

---

## Role Model & Permissions

| Capability | Attendee | Organiser |
|---|:---:|:---:|
| Browse events list | ✅ | ✅ |
| Create / Edit / Delete events | ❌ (403) | ✅ |
| View event meal menu (names) | ✅ | ✅ |
| Add / Edit / Delete meals & ingredients | ❌ (403) | ✅ |
| Submit / Update own meal preferences & allergies | ✅ | ✅ |
| View own registration | ✅ | ✅ |
| View ALL registrations & notes | ❌ (403) | ✅ |
| Run allergy conflict scanner | ❌ (403) | ✅ |
| View, Verify, or Dismiss allergy flags | ❌ (403) | ✅ |

Organiser accounts require the secret `ORGANISER_CODE` during registration.

---

## How the Conflict Engine Works & Its Limits

### Synonym Map
The engine (`server/utils/allergyCheck.js`) maps common allergens to culinary and regional synonyms:
- **Peanut**: `peanut`, `groundnut`, `arachis`, `satay`
- **Dairy / Milk**: `milk`, `cheese`, `butter`, `ghee`, `paneer`, `cream`, `curd`, `yogurt`, `whey`, `casein`, `lactose`
- **Egg**: `egg`, `mayonnaise`, `albumin`
- **Gluten / Wheat**: `wheat`, `flour`, `maida`, `atta`, `semolina`, `rava`, `barley`, `rye`, `bread`, `gluten`
- **Soy**: `soy`, `soya`, `tofu`, `edamame`
- **Tree Nut**: `almond`, `cashew`, `walnut`, `pistachio`, `hazelnut`, `pecan`
- **Shellfish**: `shrimp`, `prawn`, `crab`, `lobster`
- **Fish**: `fish`, `salmon`, `tuna`, `cod`, `tilapia`, `anchovy`, `sardine`
- **Sesame**: `sesame`, `tahini`, `til`
- **Mustard**: `mustard`

### Matching Logic
1. Each attendee's declared allergy is expanded into its synonym keywords.
2. Each meal ingredient is tested using regular expressions with word boundary checks (`(?:^|[^a-zA-Z])keyword(?:$|[^a-zA-Z])`).
3. Rescans preserve existing `verified` and `dismissed` decisions while removing pending flags that no longer conflict.

### Limitations
- The system only matches against recorded ingredients; unlisted seasonings, cross-contamination, or trace facility contaminants will not be caught.
- A human organiser must review every flagged meal and consult with catering before serving.

---

## Environment Variables

Create `server/.env` with the following variables:

```env
MONGO_URI=mongodb://localhost:27017/meal-allergy-notes
JWT_SECRET=supersecretjwtkey_changeme_in_production
ORGANISER_CODE=ORGANISER2024
PORT=5000
```

`server/.env.example` is also provided in the repository.

---

## Local Setup & Quickstart

### Prerequisites
- Node.js (v18+ recommended)
- MongoDB instance running locally or via MongoDB Atlas

### 1. Install Dependencies
```bash
# Install root, server, and client dependencies
npm run build
```
*(Or install manually: `npm install && npm install --prefix server && npm install --prefix client`)*

### 2. Configure Environment
Ensure `server/.env` exists and contains your MongoDB URI:
```bash
cp server/.env.example server/.env
# Edit server/.env with your MONGO_URI and secret keys
```

### 3. Run Unit Tests
```bash
cd server
npm test
```

### 4. Seed the Database
```bash
npm run seed
```

### 5. Start Development Mode
Runs both the backend API (port 5000) and Vite frontend (port 5173) with proxying:
```bash
npm run dev
```

### 6. Start Production Mode
Builds the React frontend and serves everything from Express on a single port:
```bash
npm run build
npm start
```
Visit `http://localhost:5000`.

---

## Seed Credentials

All accounts use password: **`Password123`**

| Role | Email | Notes |
|---|---|---|
| **Organiser** | `organiser@test.com` | Full administrative access |
| **Attendee 1** | `attendee1@test.com` | Vegetarian, allergic to dairy and tree nuts |
| **Attendee 2** | `attendee2@test.com` | Standard diet, allergic to peanut, gluten, egg |
| **Attendee 3** | `attendee3@test.com` | Vegan, allergic to egg and dairy |

---

## API Endpoints

### Health
- `GET /api/health` — Public health check

### Authentication
- `POST /api/auth/register` — Register a new account (`name`, `email`, `password`, optional `organiserCode`)
- `POST /api/auth/login` — Login with `email` and `password`, returns JWT
- `GET /api/auth/me` — Get current authenticated user profile

### Events
- `GET /api/events` — List all events (authed)
- `GET /api/events/:id` — Get single event details (authed)
- `POST /api/events` — Create event (organiser only)
- `PUT /api/events/:id` — Update event (organiser only)
- `DELETE /api/events/:id` — Delete event (organiser only)

### Meals
- `GET /api/events/:eventId/meals` — List meals for an event (authed)
- `POST /api/events/:eventId/meals` — Add meal with ingredients (organiser only, triggers conflict rescan)
- `PUT /api/meals/:id` — Update meal (organiser only, triggers conflict rescan)
- `DELETE /api/meals/:id` — Delete meal (organiser only)

### Registrations & Preferences
- `POST /api/events/:eventId/registrations` — Upsert current user's preferences & allergies (triggers rescan)
- `GET /api/registrations/mine` — Get current attendee's registrations across events
- `GET /api/events/:eventId/registrations` — Get registrations for event (organiser gets all; attendee gets own only)
- `DELETE /api/events/:eventId/registrations/mine` — Delete own registration

### Allergy Flags
- `POST /api/events/:eventId/flags/run` — Re-scan event for allergy conflicts (organiser only)
- `GET /api/events/:eventId/flags` — Get all populated conflict flags for event (organiser only)
- `PATCH /api/flags/:id` — Update flag status to `verified` or `dismissed` (organiser only)

---

## Deployment (Render)

Deploy as a single **Web Service** on [Render](https://render.com):

1. **Repository**: Connect your GitHub repository.
2. **Environment**: `Node`
3. **Build Command**:
   ```bash
   npm run build
   ```
4. **Start Command**:
   ```bash
   npm start
   ```
5. **Environment Variables**:
   - `NODE_ENV`: `production`
   - `MONGO_URI`: `mongodb+srv://<username>:<password>@cluster.mongodb.net/meal-allergy-notes?retryWrites=true&w=majority`
   - `JWT_SECRET`: `<generate-a-strong-random-key>`
   - `ORGANISER_CODE`: `<your-custom-organiser-passcode>`
   - `PORT`: `5000` (or leave default for Render)


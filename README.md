# NewsGap

This app is a redesign of [Redactle-unlimited](https://github.com/kthun/redactle-unlimited) 


## DISCLAIMER

This app is experimental and should not be considered security as a first citizen (at least yet).
The data collected and handled within this app should not be sensitive information. More specifically,
even though we do not intend to publish the information collected from users, the data might be used for
academic research. For how we collect and manage user information, please contact
Owen Kearey, the owner of this app.

## Development

This application consists of two parts: a React frontend and an Express backend API, backed by a PostgreSQL database.

### Prerequisites

- Node.js
- Docker (for the database)

### Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Configure environment variables by copying `.env` and filling in your values:
   ```bash
   cp .env .env.local
   ```
   Key variables:
   - `PGPASSWORD` / `DATABASE_URL` — must match the password set in `docker-compose.yml`
   - `JWT_SECRET` — set to a strong random string in any non-local environment

3. Start the database:
   ```bash
   docker compose up -d
   ```

4. Run database migrations:
   ```bash
   npm run migrate
   ```

### Running the Application

Start both the API server and the Vite dev server with a single command:

```bash
npm run dev
```

This will start:
- API server on http://localhost:3001
- Client dev server on http://localhost:5173

The Vite dev server is configured to proxy API requests to the backend server.

You can also run them separately if needed:
- `npm run server` - API server only
- `npm run client` - Client dev server only

### Database

The database runs in Docker but the server connects to it from the host. Migration commands:

```bash
npm run migrate        # apply pending migrations
npm run migrate:down   # roll back the last migration
```

Migration files live in `server/db/migrations/`.

### Routes

- `/auth` - Login / register
- `/quiz` - Main quiz game page (protected)
- `/settings` - Settings page (protected)

## Project Structure

### Frontend (`src/`)

- `src/pages/Home.tsx` — Landing page shown after login - includes tutorial text, a 'Start Quiz' button, and the contact and feedback dialogues.
- `src/pages/Auth.tsx` — Login and registration forms; posts credentials to the `/api/auth` routes and stores the returned session.
- `src/pages/Game.tsx` — The actual quiz (game) screen - displays the redacted article and records the player's guesses.
- `src/hooks/useQuiz.ts` — Fetches the current quiz from the API, keeps track of guessed words and score, and submits guesses back to the server.
- `src/contexts/AuthContext.tsx` — Holds the logged-in user's details in React state so any component can check whether someone is logged in without re-fetching.
- `src/contexts/LangContext.tsx` — Stores which language (English/French) the UI is currently displayed in.
- `src/contexts/ConfigContext.tsx` — Holds app-wide settings fetched from the server on load.
- `src/components/ProtectedRoute.tsx` — Wraps a page and redirects to `/auth` if no user is logged in; used to guard `/quiz` and `/settings`.

### Backend (`server/`)

- `server/index.ts` — The Express server's entry point. Registers every API route (`/api/auth`, `/api/quiz-sessions`, `/api/guesses`, `/api/feedback`, plus the inline `/api/quiz/*` routes) and starts listening on port 3001.
- `server/auth.ts` — Handles registration and login: checks the password against the database, and on success signs a JWT and sets it as a cookie so the user stays logged in.
- `server/data.ts` — Reads the article/quiz dataset and chooses which quiz to serve a given player, including the 'daily quiz' logic.
- `server/quizSessions.ts` — Records each individual play-through in the database (which quiz was served, current score).
- `server/guesses.ts` — Records each word a player guesses during a play-through and checks it against the answer.
- `server/feedback.ts` — Receives and stores feedback submitted through the Home page's feedback dialogue.
- `server/odsLoader.ts` — Reads the source article data out of `.ods` spreadsheet files and converts it into the format the app uses.
- `server/db/` — The Postgres connection setup (`index.ts`) plus every schema migration file, in `migrations/`.
- `server/friends.ts` — Leftover from a friends feature that was removed from the UI in a past commit; this file is no longer imported anywhere and can likely be deleted.

### Scripts (`scripts/`)

- `scripts/deploy/deploy.sh` — Commits and pushes changes to Git, builds the frontend, then copies the build and server code to the production server and restarts it.
- `scripts/deploy/deploy_with_prompt.sh` — Same as above but skips the git commit/push step; just builds and redeploys whatever is already committed.
- `scripts/deploy/restart_services.sh` — Restarts the production app and nginx without rebuilding or redeploying anything.
- `scripts/deploy/git-push.sh` — Commits all changes with a given (or auto-generated) message and pushes to the current branch.
- `scripts/migrations/check_migrations.js`, `remove_pending_migrations.js`, `reset_migrations.js` — One-off maintenance tools for inspecting or fixing the database's migration history directly, outside the normal `npm run migrate` flow.
- `scripts/maintenance/generate_quiz_mapping.js` — Builds a lookup mapping between quiz IDs and their source articles.
- `scripts/maintenance/show_data.js` — Connects directly to Postgres and prints out data for manual inspection.
- `scripts/maintenance/test_quiz_id.js` — A standalone script for testing quiz ID generation against the source spreadsheet.
- `scripts/maintenance/translate_ords_to_yaml.py` — Converts `.ods` article source files into YAML format.

### Root

- `fetch_data.sh` — Connects to the production server via SSH, runs `export_data.js` there, and downloads the resulting CSVs (users, guesses, feedback) to your own machine.
- `export_data.js` — Runs on the server; queries the live production database and writes out timestamped CSV exports.
- `docker-compose.yml` — Defines the local Postgres container used for development; not used in production.


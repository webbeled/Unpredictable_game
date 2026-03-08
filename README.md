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


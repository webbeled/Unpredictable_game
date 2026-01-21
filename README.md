# Unpredictable 

This app is a redesign of [Redactle-unlimited](https://github.com/kthun/redactle-unlimited) 


## DISCLAIMER

This app is experimental and do not consider security as a first citizen (at least yet).
The data collected and handled within this app should not be sensitive information. More specifically,
even though we do not intend to publish the information collected from users, the data might be used for
academic research conducted by Owen Kearey. For how we collect and manage user information, please contact
Owen Kearey, the owner of this app.

## Development

This application consists of two parts: a React frontend and an Express backend API.

### Setup

1. Install dependencies:
   ```bash
   npm install
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

### Routes

- `/quiz` - Main quiz game page
- `/settings` - Settings page


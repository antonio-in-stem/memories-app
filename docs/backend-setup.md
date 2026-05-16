# Backend Setup

Memories now runs as a full-stack Next.js app with Auth.js, Prisma, and PostgreSQL.

## Environment

Copy `.env.example` into `.venv.local` or `.env.local` and fill the values. The app loads `.venv.local` first, then `.env.local`, then `.env`:

```bash
AUTH_URL=http://localhost:3000
AUTH_SECRET=replace-with-a-generated-auth-secret
AUTH_LINKEDIN_ID=replace-with-linkedin-client-id
AUTH_LINKEDIN_SECRET=replace-with-linkedin-client-secret
DATABASE_URL=postgresql://USER:PASSWORD@HOST:PORT/DATABASE?schema=public
```

The local `.venv`, `.venv.local`, and env files are ignored by git and should not be committed.

For local tunnel testing through ngrok, keep the app running on `localhost:3000` and expose that port with ngrok. In development, the app ignores a localhost `AUTH_URL` for OAuth requests and uses the forwarded public host instead, so LinkedIn callbacks can return to the ngrok URL instead of your friend's `localhost`.

## LinkedIn OAuth

Auth.js expects the LinkedIn redirect URL to be:

```text
http://localhost:3000/api/auth/callback/linkedin
```

When sharing through ngrok, add the current ngrok callback URL to the LinkedIn app as well:

```text
https://YOUR-NGROK-DOMAIN.ngrok-free.app/api/auth/callback/linkedin
```

There is a compatibility redirect at `/login/oauth2/code/linkedin`, but the LinkedIn app should still allow the Auth.js callback URL because Auth.js generates that URL during sign-in.

## Database

After setting `DATABASE_URL`, run:

```bash
npm run db:generate
npm run db:migrate -- --name init
npm run db:seed
```

`db:seed` migrates the existing `data/profiles.json` content into PostgreSQL.

## Runtime

The frontend reads the same `Directory` contract as before. When `DATABASE_URL` is present, data comes from PostgreSQL. Without `DATABASE_URL`, the app can still fall back to JSON for local rendering, but OAuth persistence and reaction APIs require the database.

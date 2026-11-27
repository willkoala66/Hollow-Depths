# Hollow Depths

## GitHub Pages leaderboard setup

GitHub Pages hosts only the static game files. The leaderboard API must run
separately on a server that supports HTTPS and can reach the existing
PostgreSQL database.

1. Deploy `artifacts/api-server` to an HTTPS-capable host.
2. Configure `DATABASE_URL` in that API host's server-side environment. Do not
   put database credentials in the Pages workflow or frontend build.
3. Set the API host's `CORS_ALLOWED_ORIGINS` environment variable to the game
   site's exact origin, without a path. For the default GitHub Pages project
   site, this is `https://<owner>.github.io`; use your custom domain's origin
   if one is configured. Multiple origins can be comma-separated.
4. In the GitHub repository, open **Settings → Secrets and variables → Actions
   → Variables** and add `PUBLIC_API_URL` with the API server's HTTPS base URL,
   for example `https://api.example.com` (do not append `/api`).
5. Run the Pages workflow again. It builds the game with the configured API
   URL; if `PUBLIC_API_URL` is missing, the game displays a configuration
   warning instead of trying to use GitHub Pages as its API.

The game uses `/api/leaderboard` on the same origin when no external API URL is
configured, which preserves the Replit-hosted setup.


## Build and Run

first build the root(`/`) pnpm package
> `/`
> ```bash
>  PORT=<port> BASE_PATH=<base url path> pnpm run build
> ```

then you need to go into the `artifacts/metroidvania` folder and run:
> `/artifacts/metroidvania/`
> ```bash
>  PORT=<port> BASE_PATH=<base url path> pnpm run dev
> ```

or you can run build in the `aretifacts/metroidvania` and serve the files under `dist/public`
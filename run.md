# Run doc — FightTickets Angular (پرواز ۷۲۴)

Angular 21 port of the Next.js flight-ticket app. Source lives in
`.net/Front/Angular/FightTickets/angular` — this is the app root; run all
commands from there.

## Reproduce artifacts

1. Install dependencies with npm (lockfile `package-lock.json` is committed):

   ```bash
   npm install
   ```

2. Environment: `src/environments/environment.ts` and
   `src/environments/environment.development.ts` are committed with an empty
   `apiBaseUrl` (same-origin requests). No `.env` file is needed. To point at a
   real API, set `apiBaseUrl` in `environment.development.ts`.

3. No build artifacts are required for `ng serve` — it compiles in-memory.

## Run the server

```bash
npm run dev
```

- Serves on **port 4200** by default (see `package.json` `dev` script). Use a
  different port with `npx ng serve --port <port>` if 4200 is taken.
- The current preview runs `npx ng serve --port 4321`.
- Node.js ≥ 20.19 or ≥ 22.12 required (tested with 24.11).

## Notes

- Tailwind v4 + daisyUI 5 compile through `postcss.config.json` +
  `src/styles.css` (`@plugin "daisyui"` with the `winter` theme).
- The Persian date picker is a custom Angular component
  (`src/app/shared/components/persian-date-picker/`) using `jalaali-js` — the
  React library `@mngh/jalali-datepicker` from the original Next.js app could
  not be reused.
- API: the app expects a flights backend at `apiBaseUrl` (`/airports`,
  `/flights/search`, `/bookings`). Without a backend, search results will be
  empty but the UI still renders (airport list falls back to the bundled list).

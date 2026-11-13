# Development and recovery

## Restore from GitHub

Install Git, Node.js 24, and npm. Clone this repository, check out `main`, and run:

```sh
npm ci
npm run typecheck
npm test
npm run build
npm run dev
```

Dependencies are pinned in `package-lock.json`. No API key, account, database, or secret configuration is required. Do not commit `node_modules`, generated `dist`, local reports containing private input, or credentials.

`npm run preview` serves a built application on loopback. To create distributable static assets, run `npm run build`; the output is `dist/`. Deployment is a separate user decision. Preserve the base-path configuration if hosting beneath a subdirectory.

## Validation

Unit tests cover deterministic core behavior and invalid imports. TypeScript validates application code. Production builds check worker/asset resolution. The initial release also receives actual Chromium interaction and responsive checks; see [Validation](VALIDATION.md) for the recorded scope. Test fixtures are synthetic.

## Assets

Hero art and the support button are original SVG source assets. The README screenshot is captured from the real local app with its synthetic sample. Keep assets local and review their licenses when replacing them.

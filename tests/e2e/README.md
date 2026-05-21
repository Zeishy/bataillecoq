# Tests E2E BatailleCoq

Cette suite Playwright reprend la batterie lancee localement: API smoke tests, pages publiques, inscription, connexion, acces admin et deux anomalies connues.

## Prerequis

- Backend disponible sur `http://localhost:5000/api`.
- MongoDB et donnees locales compatibles avec le backend.
- Dependances installees avec `npm install`.

Le serveur Vite est lance automatiquement par Playwright sur `http://localhost:5173`.

## Commandes

```bash
npm run test:e2e
```

Mode navigateur visible:

```bash
npm run test:e2e:headed
```

Interface Playwright:

```bash
npm run test:e2e:ui
```

Mode strict, pour transformer les known issues en echecs reels:

```bash
npm run test:e2e:strict
```

## Variables utiles

```bash
E2E_API_URL=http://localhost:5000/api npm run test:e2e
E2E_BASE_URL=http://localhost:5173 npm run test:e2e
E2E_PORT=5174 npm run test:e2e
```

Apres un run, le rapport HTML est disponible avec:

```bash
npx playwright show-report
```

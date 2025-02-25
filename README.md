# Quick Plant Identification

## Install packages

1. Frontend.

```bash
npm i
```

2. Backend.

```bash
cd functions
npm i
```

## Backend testing process

1. Start emulators.

```bash
firebase emulators:start --only functions,auth
```

2. Add mock user in UI, get `UID`.

3. Get auth token.

```bash
cd functions
node testing/getAuthToken.js <UID>
```

4. Put in header and test.

```bash
curl http://localhost:5001/quick-plant-identification/asia-southeast1/app/api/ping -H "Authorization: Bearer <AUTH_TOKEN>"
```

## Frontend testing process

1. Start emulators.

```bash
firebase emulators:start --only functions
```

Note: do not start `auth` emulator - use mock user in production.

2. Run dev server.

```bash
npm run dev
```

3. Go to `http://localhost:5173`.

## Deployment process

### Firestore

1. Run deploy command.

```bash
firebase deploy --only firestore
```

### Storage

1. Run deploy command.

```bash
firebase deploy --only storage
```

### Functions

1. Run deploy command.

```bash
firebase deploy --only functions
```

### Hosting

1. Build.

```bash
npm run build
```

2. Run deploy command.

```bash
firebase deploy --only hosting
```

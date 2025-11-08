NaivaCom sync server

Lightweight JSON sync server for NaivaCom admin "Post to server" feature.

Quick start

1. Install dependencies

```bash
cd server
npm install
```

2. Run the server (development)

```bash
# default port 4002
node server.js
```

3. Environment variables

- PORT: optional, default 4002
- NAIVACOM_KEY: optional secret. If set, clients must include header `X-NaivaCom-Key: <NAIVACOM_KEY>` when calling PUT /data.

API

- GET /data

  - Returns the current JSON payload (services, testimonials, projects, team).

- PUT /data
  - Replaces the stored payload with the JSON body. If `NAIVACOM_KEY` is set on the server, the request must include header `X-NaivaCom-Key` with the same value.

Example (curl)

```bash
# fetch
curl http://localhost:4002/data

# push (no auth)
curl -X PUT -H "Content-Type: application/json" --data @payload.json http://localhost:4002/data

# push (with auth)
curl -X PUT -H "Content-Type: application/json" -H "X-NaivaCom-Key: sometoken" --data @payload.json http://localhost:4002/data
```

Notes

- This server is file-backed and uses `store.json` in the same directory. It's intended for small-scale testing and single-admin workflows. For production, consider using a proper database, HTTPS, strong auth, and backups.

# Server — Project Management Tool API

Express + PostgreSQL backend for the Project Management Tool.

## Setup

```bash
cd server
cp .env.example .env
npm install
```

Ensure PostgreSQL is running (see root `docker-compose.yml`) and the schema is applied:

```bash
# from repo root
docker compose up -d
# if not using init scripts on a fresh volume:
PGPASSWORD=pmt_dev_password psql -h localhost -p 5433 -U pmt -d project_management -f ../database/schema.sql
```

## Scripts

| Command        | Description              |
| -------------- | ------------------------ |
| `npm run dev`  | Start with nodemon       |
| `npm start`    | Start production process |

## Health check

```http
GET /api/health
```

```json
{
  "success": true,
  "message": "API is running",
  "data": null
}
```

## Environment variables

See `.env.example`. Never commit real secrets.

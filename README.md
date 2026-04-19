# Event Manager

**Backend**: Fastify + TypeScript + GraphQL (Mercurius) + TypeORM
**Queue**: pg-boss (PostgreSQL-backed async jobs)
**Database**: PostgreSQL 18.3

## Run locally

```bash
cp .env.example .env
docker compose up --build
```

## URLs

- Backend GraphQL: `http://localhost:4000/graphql`
- GraphiQL: `http://localhost:4000/graphiql`
- Health check: `http://localhost:4000/healthz`
- Mailpit UI: `http://localhost:8025`

## Testing

cUrl commands in `backend/tests`
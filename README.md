# Neo4flix Frontend

Angular 21 frontend for the Neo4flix movie recommendation platform. Communicates with a Spring Boot microservices backend through an API gateway.

## Prerequisites

- Node.js 20+
- npm 10+
- Angular CLI 21: `npm install -g @angular/cli`
- The backend services running (see backend README)

## Clone & Install

```bash
git clone https://github.com/johneliud/neo4flix-frontend
cd neo4flix-frontend
npm install
```

## Development Server

```bash
ng serve
```

Opens at `http://localhost:4200`. The app proxies all `/api/*` requests to the API gateway at `http://localhost:8081`.

## Build

```bash
ng build
```

Output goes to `dist/neo4flix-frontend`. The production build uses relative URLs — the reverse proxy handles routing to backend services.

## Running Tests

```bash
# Unit tests
ng test

# End-to-end tests
ng e2e
```

## Environment

The app uses `src/environments/` to configure the API base URL:

| File | `apiUrl` | Used for |
|------|----------|----------|
| `environment.ts` | `http://localhost:8081` | Local development |
| `environment.production.ts` | `''` (relative) | Production build |

No `.env` file is needed for the frontend. All secrets are on the backend.

## Backend

The full backend stack (API gateway + microservices + Neo4j + PostgreSQL) is started with:

```bash
cd ../          # repo root
./start-services.sh
```

This opens individual terminal windows for Docker Compose and each Spring Boot service.

## Documentation

- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) — project structure, services, routing, components, design system
- [`guide/ISSUES.md`](guide/ISSUES.md) — milestone progress tracker

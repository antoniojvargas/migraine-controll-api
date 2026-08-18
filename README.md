# Migraine Controll API

API backend para una aplicación de seguimiento y control de migrañas.

## Visión del producto

Esta API da soporte a una app móvil pensada para personas que sufren migrañas y
necesitan entender sus patrones, gestionar sus tratamientos y reducir la frecuencia e
intensidad de sus crisis. Los pilares del producto son:

- **Tracking de migrañas**: registro de cada episodio (intensidad, ubicación del dolor,
  duración, síntomas asociados, posibles disparadores) para construir un historial que
  permita identificar patrones a lo largo del tiempo, incluyendo vistas de calendario y
  estadísticas semanales.
- **Tratamientos preventivos y agudos**: seguimiento de tratamientos recurrentes
  (preventivos, con agenda y recordatorios) y de tratamientos aplicados durante una
  crisis (agudos), registrando su efectividad para ayudar al usuario y a su médico a
  ajustar el plan de tratamiento.
- **Dispositivo Cefaly**: integración con el dispositivo de neuroestimulación Cefaly,
  registrando las sesiones de uso (programa seleccionado, duración, intensidad máxima,
  nivel de batería, ubicación) y vinculándolas con los registros de migraña y
  tratamiento correspondientes.
- **Perfiles de usuario**: cada usuario cuenta con un perfil (datos demográficos,
  idioma, dispositivos asociados) sobre el que se personalizan cuestionarios de
  onboarding, recordatorios y notificaciones relevantes (por ejemplo, síntomas
  recurrentes o tendencias semanales de migrañas).

El objetivo a largo plazo es correlacionar estos datos con factores externos (como el
clima, vía integración con Terra y proveedores meteorológicos) para dar a cada usuario
información accionable sobre sus migrañas.

## Stack tecnológico

- **Runtime**: Node.js 22 + TypeScript
- **Framework HTTP**: [Fastify](https://fastify.dev/)
- **Arquitectura**: en capas (`adapter → controller → usecase → domain/dto → infra →
factory`), documentada en [`ARCHITECTURE.md`](./ARCHITECTURE.md)
- **Base de datos**: PostgreSQL (vía TypeORM, próximamente) + MongoDB/DocumentDB (para
  datos no relacionales, ej. datos de salud de integraciones externas)
- **Cloud**: AWS (Lambda, API Gateway, Cognito, SQS/SNS — planificado)
- **Validación de entorno**: [envalid](https://github.com/af/envalid)
- **Logging**: [pino](https://getpino.io/) (logs estructurados, niveles por entorno)
- **Testing**: Jest + ts-jest + Supertest
- **Infraestructura local**: Docker (multi-stage build) + Docker Compose
- **Calidad de código**: ESLint + Prettier + Husky + lint-staged
- **CI**: GitHub Actions (lint, type-check y tests con cobertura en cada push/PR)

## Cómo levantar el entorno local

### Requisitos

- Node.js 22+
- npm
- Docker y Docker Compose (opcional, recomendado para levantar Postgres/Mongo)

### 1. Variables de entorno

Copia el archivo de ejemplo y ajusta los valores según tu entorno:

```bash
cp .env.example .env
```

### 2. Instalar dependencias

```bash
npm install
```

### 3a. Levantar todo con Docker Compose (API + Postgres + Mongo)

```bash
docker compose up --build
```

La API queda disponible en `http://localhost:3000`.

### 3b. Levantar solo las bases de datos y correr la API en local

```bash
docker compose up postgres mongo
npm run build
npm run start
# o, para desarrollo con recarga vía ts-node:
npx ts-node -r tsconfig-paths/register src/index.ts
```

### 4. Verificar que todo funciona

```bash
curl http://localhost:3000/health
# {"status":"ok"}
```

## Scripts disponibles

| Script                  | Descripción                                            |
| ----------------------- | ------------------------------------------------------ |
| `npm run build`         | Compila TypeScript a `dist/` (resolviendo alias `@/*`) |
| `npm run start`         | Levanta el servidor desde el build compilado           |
| `npm run lint`          | Corre ESLint sobre `src/` y `test/`                    |
| `npm run lint:fix`      | Corre ESLint con `--fix`                               |
| `npm run format`        | Formatea el código con Prettier                        |
| `npm test`              | Corre la suite de tests con Jest                       |
| `npm run test:watch`    | Corre los tests en modo watch                          |
| `npm run test:coverage` | Corre los tests con reporte de cobertura               |

## Convenciones

- Async/await siempre, sin callbacks.
- Named exports, sin default exports.
- try/catch únicamente en la capa de entrada (controllers/handlers).
- Ver [`ARCHITECTURE.md`](./ARCHITECTURE.md) para el detalle de cada capa y la regla de
  dependencias entre ellas.

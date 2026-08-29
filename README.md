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
- **Perfiles de usuario**: cada usuario cuenta con un perfil (datos demográficos,
  idioma, dispositivos asociados) sobre el que se personalizan cuestionarios de
  onboarding, recordatorios y notificaciones relevantes (por ejemplo, síntomas
  recurrentes o tendencias semanales de migrañas).
- **Datos de wearables**: integración con [Terra](https://tryterra.co/) vía webhook
  para ingerir datos crudos de dispositivos y correlacionarlos con el clima y las
  crisis registradas.

## Stack tecnológico

- **Runtime**: Node.js 22 + TypeScript
- **Framework HTTP**: [Fastify](https://fastify.dev/)
- **Arquitectura**: en capas (`adapter → controller → usecase → domain/dto → infra →
factory`), documentada en [`ARCHITECTURE.md`](./ARCHITECTURE.md)
- **Base de datos**: PostgreSQL (vía TypeORM) + MongoDB/DocumentDB (para datos no
  relacionales, ej. payloads crudos de wearables vía Terra)
- **Validación de entrada HTTP**: [Joi](https://joi.dev/) (`src/controller/schemas/`)
- **Validación de entorno**: [envalid](https://github.com/af/envalid)
- **Cloud**: AWS Lambda + API Gateway (HTTP API) vía
  [Serverless Framework](https://www.serverless.com/), Cognito, SQS/SNS, S3, DocumentDB
- **Logging**: [pino](https://getpino.io/) (logs estructurados, niveles por entorno)
- **Observabilidad**: [Sentry](https://sentry.io/) (opcional, vía `SENTRY_DSN`)
- **Testing**: Jest + ts-jest + Supertest (unit, integration y e2e)
- **Infraestructura local**: Docker (multi-stage build) + Docker Compose
- **Calidad de código**: ESLint + Prettier + Husky + lint-staged
- **CI**: GitHub Actions (lint, type-check y tests con cobertura en cada push/PR)

## Setup local

### Requisitos

- Node.js 22+
- npm
- Docker y Docker Compose

Hay dos formas de levantar el entorno local: todo containerizado (recomendado, menor
fricción) o con Node corriendo directo en el host y solo las bases de datos en Docker.

### Opción A: todo containerizado

```bash
cp .env.example .env
docker compose up --build
```

Esto levanta la API (`http://localhost:3000`), Postgres (`localhost:5432`) y Mongo
(`localhost:27017`, simula DocumentDB) con las variables de entorno ya definidas en
`docker-compose.yml`. No hace falta `npm install` en el host.

```bash
curl http://localhost:3000/health
# {"status":"ok"}
```

### Opción B: Node en el host, solo bases de datos en Docker

```bash
cp .env.example .env
npm install
docker compose up postgres mongo
```

Luego, en otra terminal:

```bash
npm run migration:run   # aplica el schema de Postgres
npm run build && npm run start
# o, para desarrollo con recarga vía ts-node (sin build previo):
npx ts-node -r tsconfig-paths/register src/index.ts
```

### Sin Docker en absoluto

Si ya tenés Postgres y Mongo corriendo localmente (o apuntás a instancias remotas),
ajustá `.env` con esos datos de conexión y saltate el paso de `docker compose up`. El
resto del flujo (`npm install`, `migration:run`, `build`, `start`) es igual.

## Variables de entorno

Definidas y validadas en `src/config/env.ts` (vía `envalid`). Referencia completa en
[`.env.example`](./.env.example).

| Variable                      | Requerida | Default                                  | Descripción                                                 |
| ----------------------------- | :-------: | ---------------------------------------- | ----------------------------------------------------------- |
| `NODE_ENV`                    |    No     | `development`                            | `development` \| `test` \| `production`                     |
| `PORT`                        |    No     | `3000`                                   | Puerto HTTP de la API                                       |
| `DB_HOST`                     |    Sí     | —                                        | Host de PostgreSQL                                          |
| `DB_PORT`                     |    No     | `5432`                                   | Puerto de PostgreSQL                                        |
| `DB_USER`                     |    Sí     | —                                        | Usuario de PostgreSQL                                       |
| `DB_PASSWORD`                 |    Sí     | —                                        | Password de PostgreSQL                                      |
| `DB_NAME`                     |    Sí     | —                                        | Base de datos de PostgreSQL                                 |
| `AWS_REGION`                  |    No     | `us-east-1`                              | Región de AWS usada por los SDKs                            |
| `AWS_ACCESS_KEY_ID`           |    No     | `''`                                     | Credenciales AWS (vacío = usa credential chain por defecto) |
| `AWS_SECRET_ACCESS_KEY`       |    No     | `''`                                     | Credenciales AWS                                            |
| `JWT_SECRET`                  |    Sí     | —                                        | Secreto usado en verificación de tokens                     |
| `COGNITO_USER_POOL_ID`        |    No     | `''`                                     | User pool de Cognito para verificar JWTs                    |
| `COGNITO_LEGACY_USER_POOL_ID` |    No     | `''`                                     | User pool legado, solo si aplica migración de usuarios      |
| `NOTIFICATION_QUEUE_URL`      |    No     | `''`                                     | URL de la SQS de notificaciones                             |
| `WEATHER_QUEUE_URL`           |    No     | `''`                                     | URL de la SQS de clima                                      |
| `WEATHER_PROVIDER_BASE_URL`   |    No     | `https://api.open-meteo.com/v1/forecast` | Proveedor de datos meteorológicos                           |
| `TERRA_RAW_PAYLOADS_BUCKET`   |    No     | `''`                                     | Bucket S3 donde se guardan los payloads crudos de Terra     |
| `CA_BUNDLES_BUCKET`           |    No     | `''`                                     | Bucket S3 con el bundle de CA para TLS a DocumentDB         |
| `CA_BUNDLE_KEY`               |    No     | `global-bundle.pem`                      | Key del bundle de CA dentro del bucket                      |
| `DOCUMENTDB_ENABLED`          |    No     | `false`                                  | Habilita la escritura de datos crudos a DocumentDB/Mongo    |
| `DOCUMENTDB_URI`              |    No     | `''`                                     | URI de conexión a DocumentDB/Mongo                          |
| `DOCUMENTDB_DATABASE`         |    No     | `terra`                                  | Base de datos en DocumentDB/Mongo                           |
| `DOCUMENTDB_COLLECTION`       |    No     | `health_data`                            | Colección en DocumentDB/Mongo                               |
| `SENTRY_DSN`                  |    No     | `''`                                     | DSN de Sentry (vacío = Sentry deshabilitado)                |

Para desplegar con Serverless Framework, además de estas variables se necesitan las
documentadas en [`secrets.example.yml`](./secrets.example.yml) (mismo set, pensado para
exportarse en el shell o inyectarse como secrets de CI en vez de vivir en `.env`).

## Scripts disponibles

| Script                       | Descripción                                                    |
| ---------------------------- | -------------------------------------------------------------- |
| `npm run build`              | Compila TypeScript a `dist/` (resolviendo alias `@/*`)         |
| `npm run start`              | Levanta el servidor desde el build compilado                   |
| `npm run lint`               | Corre ESLint sobre `src/` y `test/`                            |
| `npm run lint:fix`           | Corre ESLint con `--fix`                                       |
| `npm run format`             | Formatea el código con Prettier                                |
| `npm test`                   | Corre la suite de tests unitarios con Jest                     |
| `npm run test:watch`         | Corre los tests unitarios en modo watch                        |
| `npm run test:coverage`      | Corre los tests unitarios con reporte de cobertura             |
| `npm run test:integration`   | Corre los tests de integración contra Postgres real (Docker)   |
| `npm run test:e2e`           | Corre el flujo end-to-end completo vía Docker Compose          |
| `npm run typeorm`            | CLI de TypeORM con path aliases resueltos                      |
| `npm run migration:generate` | Genera una migración a partir de cambios en las entities       |
| `npm run migration:run`      | Aplica las migraciones pendientes                              |
| `npm run migration:revert`   | Revierte la última migración aplicada                          |
| `npm run seed`               | Puebla la base de datos con datos de ejemplo                   |
| `npm run sls:package`        | Compila y empaqueta el proyecto para Serverless, sin desplegar |
| `npm run sls:deploy`         | Compila y despliega a AWS vía Serverless Framework             |

### Tests de integración y e2e

Ambos requieren Docker corriendo:

```bash
# Integración: levanta Postgres real vía docker-compose.test.yml
npm run test:integration

# E2E: levanta el stack completo (API, Postgres, Mongo, LocalStack SQS)
# vía docker-compose.e2e.yml y corre el flujo registro → perfil → onboarding →
# log → notificación de punta a punta
npm run test:e2e
```

## Deploy

El despliegue a AWS se hace con [Serverless Framework](https://www.serverless.com/)
(`serverless.yml`), usando Lambdas detrás de API Gateway (HTTP API), un rol IAM por
función siguiendo mínimo privilegio, y colas/topics/buckets provisionados como parte del
mismo stack (SQS, SNS, S3, DynamoDB).

### 1. Configurar credenciales de AWS

```bash
aws configure
# o exportar AWS_ACCESS_KEY_ID / AWS_SECRET_ACCESS_KEY / AWS_REGION
```

### 2. Configurar secretos de despliegue

`serverless.yml` lee cada valor sensible desde el entorno del shell (`${env:VAR}`), no
desde un archivo. Usá [`secrets.example.yml`](./secrets.example.yml) como referencia:

```bash
cp secrets.example.yml secrets.yml   # secrets.yml está en .gitignore, nunca se commitea
# completá los valores reales en secrets.yml
export $(grep -v '^#' secrets.yml | sed 's/: /=/' | xargs)
```

En CI, estas variables se inyectan como secrets del pipeline en vez de usar este
archivo.

### 3. Desplegar

```bash
npm run sls:deploy -- --stage dev     # o --stage staging / --stage prod
```

`npm run sls:package` compila y empaqueta sin desplegar, útil para revisar el
CloudFormation resultante antes de un deploy real (`npx serverless print --stage <stage>`
también sirve para inspeccionar la configuración resuelta).

## Convenciones

- Async/await siempre, sin callbacks.
- Named exports, sin default exports.
- try/catch únicamente en la capa de entrada (controllers/handlers).
- Toda entrada HTTP se valida con esquemas Joi antes de llegar a la capa de dominio
  (`src/controller/schemas/`).
- Ver [`ARCHITECTURE.md`](./ARCHITECTURE.md) para el detalle de cada capa y la regla de
  dependencias entre ellas.
- Ver [`SECURITY.md`](./SECURITY.md) para la política de reporte de vulnerabilidades.
- Ver [`CHANGELOG.md`](./CHANGELOG.md) para el historial de versiones.

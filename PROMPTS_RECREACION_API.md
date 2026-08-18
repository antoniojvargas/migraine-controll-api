# Prompts para Recrear la API desde Cero (100)

Este documento contiene una secuencia de prompts numerados, pensados para reconstruir
—en un repositorio nuevo, commit a commit— una versión mejorada de esta API (arquitectura
en capas: `adapter → controller → usecase → domain/dto → infra → factory`, Node.js +
TypeScript, Fastify, TypeORM + PostgreSQL, AWS Lambda/Serverless, Cognito, SQS/SNS,
DocumentDB/MongoDB, integración Terra, motor de notificaciones).

Cada prompt está diseñado para producir un cambio pequeño y coherente (un buen "commit"
por prompt), ideal para generar un historial de contribuciones sano en GitHub. Úsalos en
orden; puedes saltarte o repetir alguno según cómo evolucione el proyecto.

Al final de cada prompt encontrarás la instrucción obligatoria de commit/push.

---

## Fase 0 — Fundación del proyecto

**1.** Inicializa un repositorio Node.js con TypeScript: `package.json`, `tsconfig.json`
(paths con alias `@/*` apuntando a `src/*`), `.eslintrc.js` con reglas para TS,
`.prettierrc`, `.gitignore` y `.nycrc.json` para cobertura. No agregues aún dependencias
de framework.
has commit y push

**2.** Configura Husky + lint-staged para correr ESLint y Prettier en pre-commit, y un
hook de pre-push que ejecute `tsc --noEmit`.
has commit y push

**3.** Crea la estructura de carpetas vacía (con `.gitkeep`) que reflejará la arquitectura
en capas: `src/adapter`, `src/controller`, `src/usecase`, `src/domain`, `src/dto`,
`src/infra`, `src/factory`, `src/config`, `src/utils`, `test`.
Documenta el propósito de cada capa en un `ARCHITECTURE.md`.
has commit y push

**4.** Añade Fastify como framework HTTP y crea un `src/index.ts` mínimo que levante un
servidor local con un endpoint `GET /health` que responda `{ status: 'ok' }`.
has commit y push

**5.** Configura variables de entorno con validación estricta (usa `envalid` o Joi) en
`src/config/env.ts`, exportando un objeto `envs` tipado (NODE_ENV, PORT, DB credentials,
AWS region, etc.).
has commit y push

**6.** Configura un logger estructurado (pino) en `src/config/logger.ts`, con niveles por
entorno y serialización de errores. Reemplaza cualquier `console.log` por `logger`.
has commit y push

**7.** Añade Docker: `Dockerfile` multi-stage (build + runtime) y `docker-compose.yml`
con servicios `api`, `postgres` y `mongo` (para el futuro DocumentDB local).
has commit y push

**8.** Configura Jest + Supertest + ts-jest para pruebas unitarias e integración, con
`test/setup.ts` y un primer test trivial sobre `GET /health`.
has commit y push

**9.** Configura GitHub Actions: workflow de CI que instale dependencias, corra lint,
`tsc --noEmit` y `jest --coverage` en cada push/PR.
has commit y push

**10.** Escribe un `README.md` inicial describiendo visión del producto (tracking de
migrañas, tratamientos preventivos/agudos, dispositivo Cefaly, perfiles de usuario),
stack tecnológico y cómo levantar el entorno local.
has commit y push

---

## Fase 1 — Capa de datos: conexión y entidades base

**11.** Instala TypeORM + `pg` y crea `src/infra/database/dataSource.ts` con la
`DataSource` principal de PostgreSQL, usando las variables de `envs`.
has commit y push

**12.** Crea el script npm `migration:generate`/`migration:run`/`migration:revert` usando
la CLI de TypeORM, y una carpeta `src/infra/database/migrations/` vacía con README de
convenciones (nombre `Descripcion<timestamp>.ts`, migraciones idempotentes con guardas
`information_schema`).
has commit y push

**13.** Define la entidad `UserEntity` (id UUID, email único, external_id de Cognito,
timestamps, soft-delete `deleted_at`/`original_email`) y su migración inicial.
has commit y push

**14.** Define la entidad `ProfileEntity` (relación 1:1 con `User`, nombre, género,
fecha de nacimiento, idioma, `geohash6`, `app_version`, `has_taken_survey`) y su
migración, incluyendo índice sobre `user_id`.
has commit y push

**15.** Define la entidad `DeviceEntity` (relación con `Profile`, `status`, metadata de
teléfono: `app_version`, `phone_manufacturer`, `phone_os_name`, `phone_os_version`) y su
migración.
has commit y push

**16.** Define las entidades del formulario clásico: `QuestionEntity`, `SelectionEntity`,
`TranslationEntity`, con sus relaciones (`Question 1:N Selection`, `Selection 1:N
Translation`) y migraciones correspondientes.
has commit y push

**17.** Define `UserResponseEntity` (respuesta de usuario a una pregunta/selección,
enlazable opcionalmente a `migraine_log_id` o `preventive_treatment_id`) y su migración
con FKs e índices.
has commit y push

**18.** Define `SessionEntity` (sesión de tratamiento con el dispositivo: `prog_selected`
acute/preventive, `duration`, `max_intensity`, `battery_level`, lat/long, metadata de
teléfono, `treatment_id`) y su migración.
has commit y push

**19.** Define `MigraineLogEntity` (registro de migraña: intensidad, ubicación de dolor,
inicio/fin, relación opcional a `Session`, relación con `UserResponse`) y su migración.
has commit y push

**20.** Define `PreventiveTreatmentEntity` y `PreventiveTreatmentScheduleEntity`
(tratamiento recurrente con `is_recurrent`, `repeat_until`, y su tabla de agenda con
`reminder_before_log`), con migraciones y FKs entre ambas.
has commit y push

**21.** Define `PreventiveTreatmentScheduleMetadataEntity`, `FeelingTodayEntity` y
`PushNotificationTokenEntity` (token, canal APNS/GCM/APNS_SANDBOX, metadata de teléfono,
único por usuario+token) con sus migraciones.
has commit y push

**22.** Define `AppVersionEntity` (versión mínima soportada por entorno, flags de
force-update y anuncio) y `PreferredAnswersEntity`, con migraciones.
has commit y push

**23.** Define `AcuteTreatmentWorseFeedbackOptionsEntity` y la tabla puente
`UserResponseAcuteTreatmentWorseFeedbackOptionsEntity`, con migración de FKs.
has commit y push

**24.** Crea la barrera `src/infra/database/entity/index.ts` que reexporta todas las
entidades, y registra todas en la `DataSource`. Verifica con
`typeorm migration:run` que el esquema completo se aplica limpio sobre Postgres local.
has commit y push

**25.** Añade índices de performance (compuestos) sobre columnas de consulta frecuente:
`profile(user_id)`, `preventive_treatment(user_id, started_at)`,
`migraine_log(user_id, started_at)`, `user_responses(profile_id)`. Documenta el criterio
de indexación en `ARCHITECTURE.md`.
has commit y push

---

## Fase 2 — Repositorios genéricos

**26.** Diseña `RepositoryInterface<T>` genérica (`create`, `bulkCreate?`, `findOneBy`,
`findAllBy`, `update`, `createQueryBuilder`) en `src/infra/database/repository/`.
has commit y push

**27.** Implementa `UserRepository`, `ProfileRepository` y `DeviceRepository` sobre la
interfaz genérica, usando el `Repository<T>` de TypeORM internamente.
has commit y push

**28.** Implementa `QuestionRepository`, `SelectionRepository`, `TranslationRepository` y
`UserResponseRepository` (con `bulkCreate`).
has commit y push

**29.** Implementa `SessionRepository`, `MigraineLogRepository`,
`PreventiveTreatmentRepository` y `PreventiveTreatmentScheduleRepository`.
has commit y push

**30.** Implementa `PushNotificationTokenRepository` (con `delete`),
`AppVersionRepository`, `PreferredAnswersRepository` y
`AcuteTreatmentWorseFeedbackOptionsRepository`.
has commit y push

**31.** Escribe tests de integración para al menos 3 repositorios usando una base de datos
de test (Postgres vía docker-compose), cubriendo `create`, `findOneBy` y `findAllBy`.
has commit y push

---

## Fase 3 — Dominio y DTOs

**32.** Crea las clases de dominio `User`, `Profile`, `Device` con métodos
`createNewX(dto)`/`updateX(dto)` que validan invariantes de negocio (no dependen de
TypeORM ni de HTTP).
has commit y push

**33.** Crea las clases de dominio `Question`, `Selection`, `Translation` y
`UserResponse` con sus validaciones (tipos de respuesta permitidos, longitud de texto,
idiomas soportados).
has commit y push

**34.** Crea las clases de dominio `Session`, `MigraineLog` y `PreventiveTreatment`,
validando rangos (duración 0–90, intensidad 0–100, fechas coherentes started/ended).
has commit y push

**35.** Define los DTOs de entrada con Joi para cada caso de uso de creación (uno por
entidad principal), en `src/dto/`, reutilizando esquemas comunes (paginación, timezone,
uuid) desde `src/dto/common.ts`.
has commit y push

**36.** Añade tests unitarios puros (sin DB) para cada clase de dominio, cubriendo casos
válidos e inválidos.
has commit y push

---

## Fase 4 — Casos de uso CRUD base

**37.** Define `UseCaseInterface<TInput, TOutput>` y el patrón estándar: `execute` como
arrow function, try/catch, dominio valida → mapeo manual a entidad → persistencia vía
repo, con `handleErrorResponse` central para errores.
has commit y push

**38.** Implementa `CreateUserUc`, `FindUserUc` (por id/external_id) y las variantes de
actualización de usuario.
has commit y push

**39.** Implementa `CreateProfileUc` (idempotente: retorna perfil existente si ya hay uno
por `user_id`) y `FindProfileUc`.
has commit y push

**40.** Implementa `CreateDeviceUc` y `FindDevicesUc` (listado activo por perfil,
ordenado por `updated_at`).
has commit y push

**41.** Implementa `CreateQuestionUc`, `CreateSelectionUc`, `CreateTranslationUc` y sus
`Find*` correspondientes (por categoría, por tipo).
has commit y push

**42.** Implementa `CreateUserResponseUc` (maneja tanto respuesta existente por
`answer_id` como respuesta custom "Add Other" que crea Selection + Translation nuevas) y
su variante batch `CreateUserResponsesUc`.
has commit y push

**43.** Implementa `CreateSessionUc` / `CreateSessionsUc` (batch), aplicando límites de
duración/intensidad según `prog_selected`.
has commit y push

**44.** Implementa `CreateMigraineLogUc`: creación del log, enlace opcional a
`SessionEntity`, procesamiento de `user_responses` (existentes + custom), y upsert de
respuesta a nivel de perfil si aún no existía.
has commit y push

**45.** Extiende `CreateMigraineLogUc` con la detección de síntomas recurrentes
(≥5 apariciones en 30 días) para sugerir agregarlos al perfil (deja el hook listo, sin
notificación todavía).
has commit y push

**46.** Implementa `CreatePreventiveTreatmentUc` (mismo patrón de user_responses que
migraine log) y `CreatePreventiveTreatmentScheduleUc`, con el cálculo de
`reminder_before_log` y el algoritmo de "catch-up" de fechas recurrentes
(Day/Week/Month/Year) extraído a un helper compartido (evita la duplicación que existía
en el proyecto original).
has commit y push

**47.** Implementa `CreatePushNotificationTokenUc` (upsert por token existente del mismo
usuario) y `DeletePushNotificationTokenUc`.
has commit y push

**48.** Implementa `FindMigraineLogUc`/`FindMigraineLogsUc` (estadísticas semanales
sun–sat de migrañas y tratamientos) y `FindCalendarViewUc` (vista de calendario agrupada
por año/mes/día, con soporte de timezone).
has commit y push

**49.** Implementa `FindPreventiveTreatmentUc`/`FindPreventiveTreatmentsUc` y
`FindPreventiveTreatmentScheduleUc`.
has commit y push

**50.** Escribe tests unitarios (mockeando repos) para los 10 casos de uso más críticos
(User, Profile, MigraineLog, PreventiveTreatment, UserResponse).
has commit y push

---

## Fase 5 — Sistema de formularios dinámicos ("new forms")

**51.** Diseña las entidades `NewQuestionEntity`, `NewSelectionEntity`,
`NewTranslationEntity`, `NewUserResponseEntity` como evolución del sistema de
preguntas/respuestas (soporta `value` libre e `is_custom`), con migraciones y FKs.
has commit y push

**52.** Implementa `NewQuestionRepository`, `NewSelectionRepository`,
`NewTranslationRepository`, `NewUserResponseRepository` (con `bulkCreate`).
has commit y push

**53.** Implementa `CreateUserResponsesNewFormsUc` (borra respuestas previas del usuario
y las reemplaza en batch dentro de una transacción).
has commit y push

**54.** Implementa `FindOnboardingQuestionaryNewFormsUc` (arma el formulario con
selections/translations en `en`/`fr`, marcando `isSelected`/`value` según respuestas
previas del usuario) y `FindUserNewFormsResponseByUserUc`.
has commit y push

**55.** Implementa `FindOnboardingQuestionaryFormsUc`/`FindOnboardingQuestionaryFormUc`
(sistema legacy de formularios por categoría `forms@...`) y
`FindMigraineLogFormsUc`/`FindMigraineLogFormUc` (categoría `migraine_log@...`),
reutilizando lógica común de mapeo pregunta→selección→traducción en un helper.
has commit y push

**56.** Escribe tests de integración que verifiquen el armado correcto de un formulario
completo en ambos idiomas contra datos sembrados (seed) de prueba.
has commit y push

---

## Fase 6 — Seeds y datos de referencia

**57.** Crea el helper genérico `seedData<T>(dataSource, entity, data, entityName)` y la
infraestructura de `typeorm-extension` (`Seeder` interface) en
`src/infra/database/seeds/utils/baseSeeder.ts`.
has commit y push

**58.** Escribe los seeders `question.seeder.ts`, `selection.seeder.ts`,
`translation.seeder.ts` con el set completo de preguntas del onboarding y migraine log
(idempotentes vía `findOne` + `insert` guard).
has commit y push

**59.** Escribe `newQuestion.seeder.ts`, `newSelection.seeder.ts`,
`newTranslation.seeder.ts` a partir de archivos JSON en `data/` (nuevo sistema de
formularios).
has commit y push

**60.** Escribe seeders de datos mínimos de desarrollo: `user.seeder.ts`,
`profile.seeder.ts`, `device.seeder.ts`, `appVersion.seeder.ts`,
`acuteTreatmentWorseFeedbackOptions.seeder.ts`, `preferredAnswers.seeder.ts`.
has commit y push

**61.** Crea el script CLI `populate.ts` que orquesta todos los seeders en el orden
correcto de dependencias (para levantar un entorno local con datos completos en un solo
comando `npm run seed`).
has commit y push

---

## Fase 7 — Capa de controllers, validación y adapters HTTP

**62.** Define el patrón estándar de controller: Joi validation → resolución de
sesión/usuario → ejecución del use case → `handleSuccessResponse`/`handleErrorResponse`,
en `src/controller/utils.ts`, junto con el enum `ErrorMessages`.
has commit y push

**63.** Implementa los controllers de `User` y `Profile` (crear, obtener, actualizar) y
sus rutas Fastify en `src/adapter/http/`.
has commit y push

**64.** Implementa los controllers de `Device`, `Session` y `PushNotificationToken`.
has commit y push

**65.** Implementa los controllers de `MigraineLog` (crear, listar, stats semanales,
calendario) y `PreventiveTreatment` (crear, listar, agenda).
has commit y push

**66.** Implementa los controllers de `UserResponse` (legacy y new-forms) y de
formularios (`onboarding`, `migraine_log`).
has commit y push

**67.** Implementa el controller de `AppVersion` (chequeo de versión mínima/force-update)
y de `PreferredAnswers`/`AcuteTreatmentFeedback`.
has commit y push

**68.** Añade middlewares transversales en Fastify: manejo global de errores, CORS,
rate-limiting básico, request-id/correlation-id para logs.
has commit y push

**69.** Documenta todos los endpoints en `openapi.yml` (OpenAPI 3), generado/mantenido a
mano, y sirve la documentación interactiva (Swagger UI) en un endpoint `/docs` solo en
entornos no productivos.
has commit y push

**70.** Escribe tests de integración con Supertest sobre los endpoints principales
(`POST /profiles`, `POST /migraine-logs`, `POST /preventive-treatments`,
`GET /calendar-view`), usando una DB de test real vía Docker.
has commit y push

---

## Fase 8 — Autenticación y Cognito

**71.** Documenta y configura un User Pool de AWS Cognito (infra as code) con triggers:
Pre-SignUp, Post-Confirmation, Post-Authentication.
has commit y push

**72.** Implementa `CognitoSignUpUc` (bloquea duplicados por email, aplica cooldown de 30
días para cambios de email) como handler del trigger Pre-SignUp.
has commit y push

**73.** Implementa `CognitoPostSignUpUc` (crea `User`+`Profile` para usuarios nuevos,
maneja migración de usuarios existentes y flujo de cambio de email con
`email_updated_at`).
has commit y push

**74.** Implementa `CognitoPostSignInUc` (sincroniza `external_id`/`sub`, auto-crea
`User`+`Profile` para usuarios de Sign In With Apple) y
`CognitoUpdateUserAttributesUc` (sincroniza nombre/género/fecha de nacimiento hacia
Cognito).
has commit y push

**75.** Implementa `CognitoDeleteUserUc`: resolución de usuario por `sub` con fallback a
email, soporte de pool antiguo, tombstoning por mutación de email para usuarios de Apple
Sign-In, y `AdminDeleteUserCommand` para el resto. Expón el endpoint de borrado de cuenta
(`DELETE /users/me`) cumpliendo requisitos de App Store/Play Store de auto-eliminación.
has commit y push

**76.** Implementa el middleware de autorización Fastify que valida el JWT de Cognito en
cada request protegido y adjunta el usuario resuelto al `request.user`.
has commit y push

**77.** Escribe tests unitarios de los casos de uso de Cognito mockeando el SDK de AWS,
cubriendo los distintos escenarios de usuarios (Apple, email/password, migrados).
has commit y push

---

## Fase 9 — Infraestructura AWS: Lambda, colas y almacenamiento

**78.** Configura `serverless.yml` con los recursos base: API Gateway HTTP API, funciones
Lambda por dominio (users, profiles, sessions, migraine-logs, preventive-treatments,
notifications, terra), IAM roles mínimos por función.
has commit y push

**79.** Crea los adapters Lambda (`src/adapter/lambda/`) que envuelven los controllers
Fastify existentes (usando `@fastify/aws-lambda` o un wrapper propio), con
`errorWrapper` central para logging estructurado de errores no controlados.
has commit y push

**80.** Añade colas SQS: `NOTIFICATION_QUEUE`, `WEATHER_QUEUE`, y sus definiciones de
recursos + permisos en `serverless.yml`; crea el cliente SQS compartido en
`src/infra/aws/sqsClient.ts`.
has commit y push

**81.** Añade bucket S3 para payloads crudos (Terra) y CA bundles, con su cliente en
`src/infra/aws/s3Client.ts` y utilidades de resolución de contenido (bucket/key, URI S3,
o archivo local).
has commit y push

**82.** Configura Sentry (o equivalente) para captura de errores en producción,
integrado en `errorWrapper` y en el bootstrap de Lambda (`instrument.js` equivalente).
has commit y push

---

## Fase 10 — Motor de notificaciones push

**83.** Crea `src/usecase/notification/dateHelpers.ts` (bucketing semanal: `getWeekStart`,
`getWeekKey`, `calculateAverageMigrainesPerWeek`) con tests unitarios exhaustivos.
has commit y push

**84.** Crea `src/usecase/notification/notificationHelpers.ts`: `dedupeTokens`,
`enqueueNotificationForToken` (payload hacia SQS con metadata de teléfono),
`notifyUsers` (fan-out a todos los tokens de una lista de usuarios).
has commit y push

**85.** Implementa el Lambda consumidor de `NOTIFICATION_QUEUE` que despacha el push real
vía Amazon Pinpoint (o SNS), manejando reintentos y dead-letter queue.
has commit y push

**86.** Implementa el caso de uso de "recordatorio de tratamiento preventivo" (lee
`PreventiveTreatmentScheduleEntity` con `reminder_before_log` vencido y encola
notificaciones) como Lambda programado (`schedule` en `serverless.yml`).
has commit y push

**87.** Implementa el caso de uso de "detección de síntoma recurrente" (≥5 veces en 30
días) que efectivamente encola la notificación sugiriendo agregarlo al perfil, cerrando
el hook dejado en el prompt 45.
has commit y push

**88.** Implementa el caso de uso de "tendencia semanal de migrañas" usando
`calculateAverageMigrainesPerWeek`, para notificar variaciones significativas
semana-a-semana.
has commit y push

---

## Fase 11 — Geolocalización, clima e integración Terra

**89.** Implementa `src/utils/geohash.ts` (`encodeGeohash6`, `decodeGeohash6`) con tests
de precisión, y su uso en `CreateProfileUc` para calcular `geohash6` a partir de
lat/lon.
has commit y push

**90.** Diseña la entidad `WeatherTileEntity` (por `geohash6`, con timestamps de
ingesta de histórico/forecast) y su repositorio con `findOrCreate`,
`findTilesNeedingHistoryBackfill` (>24h), `findTilesNeedingForecastUpdate` (>6h).
has commit y push

**91.** Implementa el Lambda consumidor de `WEATHER_QUEUE` que, dado un `geohash6`,
ingiere datos de clima de un proveedor externo y los guarda en `WeatherTileEntity`/
DocumentDB para correlación posterior con migrañas.
has commit y push

**92.** Diseña las entidades de integración Terra (`TerraUserEntity`,
`TerraHealthDataEntity`, `TerraWebhookLogEntity`) con sus repositorios (usando
`Between()` de TypeORM en vez de operadores Mongo-style para evitar el bug detectado en
el proyecto original).
has commit y push

**93.** Define `DataProcessorInterface` (`process`, `getName`, `isEnabled`) e implementa
`DatabaseDataProcessor`, `S3DataProcessor` (clave estructurada
`terra-payloads/YYYY-MM-DD/data_type/user_id-timestamp.json`) y `DocumentDBDataProcessor`
(gestión completa del cliente Mongo, resolución de CA bundle).
has commit y push

**94.** Implementa `MultiDestinationDataProcessor` (orquesta todos los processors
habilitados en paralelo con `Promise.allSettled`, agregando éxitos/fallos) y el Lambda
webhook que recibe payloads de Terra y los despacha.
has commit y push

**95.** Añade la tabla `user_daily_vitals` (agregado diario de sueño/actividad desde
DocumentDB) con su migración e índice por `date_local`, y el job batch que la puebla.
has commit y push

---

## Fase 12 — Reportes, calidad y cierre

**96.** Implementa `FindReportUc`: agregaciones de frecuencia/intensidad/duración de
migrañas, top de disparadores/síntomas/tratamientos, distribución por día de la semana e
intensidad, promedio mensual — todo cubierto con tests usando datasets sintéticos.
has commit y push

**97.** Sube la cobertura de tests a un umbral mínimo razonable (p. ej. 80% en
`usecase` y `domain`), configurando el gate de cobertura en CI (`.nycrc.json` +
`jest --coverage --coverageThreshold`).
has commit y push

**98.** Escribe una suite de tests end-to-end que levante toda la stack vía
`docker-compose` (API + Postgres + Mongo) y ejercite un flujo completo: registro →
creación de perfil → onboarding → log de migraña → notificación encolada.
has commit y push

**99.** Audita seguridad: revisa que no haya secretos en el repo, agrega
`secrets.example.yml`, valida sanitización de inputs (Joi en todos los endpoints),
revisa permisos IAM mínimos en `serverless.yml`, y agrega `SECURITY.md` con política de
reporte de vulnerabilidades.
has commit y push

**100.** Escribe la documentación final: `README.md` completo (setup local
containerizado y no containerizado, variables de entorno, scripts npm, deploy),
`CHANGELOG.md` inicial versión 1.0.0, y etiqueta el release `v1.0.0` en git.
has commit y push

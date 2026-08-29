# Recomendaciones de refactor pendientes

Este documento recoge los hallazgos de la auditoría de arquitectura y su estado.
Los cambios de comportamiento restantes (A3–A5) siguen pendientes de decisión; el
grupo B es _cleanup_ de bajo impacto.

Ya aplicado en `main`:

| Área                                    | Cambio                                                                                                                                                                                                                                                                                                                                      |
| --------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `BaseRepository<T>`                     | 24 repositorios colapsados a `extends BaseRepository<XEntity>` (−732 LOC)                                                                                                                                                                                                                                                                   |
| `buildRepositories`                     | Punto único de ensamblado de repositorios; adoptado por `build-app.ts`, las 5 Lambdas de cron/cola y los 3 triggers de Cognito                                                                                                                                                                                                              |
| `classifyError`                         | Única fuente de verdad para el mapeo de errores; `handle-error-response.ts` y `adapter/http/error-handler.ts` delegan en ella                                                                                                                                                                                                               |
| `persistUserResponses`                  | Bucle de persistencia de respuestas + `upsertPreferredAnswerIfAbsent` hoisteados a `UserResponseBaseUc` (dedupe en 3 casos de uso)                                                                                                                                                                                                          |
| `domain/patterns.ts` + `parseDateRange` | Regexes de formato y parseo de rango de fechas centralizados                                                                                                                                                                                                                                                                                |
| cleanup                                 | Se eliminó `resolveRequestUser` (código muerto); `console.log` → `logger` en triggers                                                                                                                                                                                                                                                       |
| **A1 — Transacciones**                  | `CreateMigraineLogUc` / `CreatePreventiveTreatmentUc` crean el padre + persisten respuestas dentro de `dataSource.transaction`; `UserResponseBaseUc` recibe un `DataSource` opcional y liga los repos al `EntityManager` (`withTransaction` / `buildResponseRepos`). Detección de síntomas + notificaciones quedan fuera de la transacción. |
| **A2 — Autorización por propietario**   | `app.authenticateOwner` (401 sin token / token inválido, 403 si `:userId` ≠ usuario del token) aplicado a las 7 rutas `/users/:userId/*`. `src/index.ts` (solo local/e2e) usa `InsecureBearerSubVerifier` cuando `NODE_ENV !== 'production'`.                                                                                               |

---

## A. Cambios que alteran comportamiento — pendientes de decisión

### A3. `detectRecurrentSymptoms` fuera del camino de la request

`CreateMigraineLogUc` ejecuta, **antes de responder**, un `GROUP BY` sobre 30
días de `user_responses ⨝ migraine_logs`, más un lookup de tokens push y envíos
a SQS. Recomendado: emitir un evento / mensaje SQS tras el commit y que un
consumidor haga la detección + notificación. Cambia la _forma_ de la respuesta
(el campo `recurrentSymptoms` dejaría de venir sincrónico), por eso es opt-in.

### A4. Rate limiter con estado compartido

`adapter/http/plugins/rate-limit.ts` usa un `Map` en memoria: bajo Lambda el
límite efectivo es `max × nº de instancias` y se resetea en cada cold start.
Recomendado: mover el contador a un store compartido (ElastiCache/Redis, o
DynamoDB con TTL) detrás de la misma interfaz `RateLimitOptions`.

### A5. Contrato de error de los casos de uso

Los 44 `try { … } catch (e) { handleErrorResponse(e) }` de cada `execute` son
redundantes: `executeController` y el error handler de Fastify ya mapean. Pero
quitarlos cambia el contrato observable de 44 clases (hoy garantizan `AppError`
a la salida) y rompe ~40 archivos de test que hacen
`rejects.toMatchObject({ code: 'DOMAIN_VALIDATION_ERROR' })` sobre el caso de
uso directo. Si se decide unificar: quitar el `try/catch`, dejar que los casos
de uso lancen `DomainError`/errores crudos, y migrar esos tests a afirmar sobre
el tipo de error de dominio (o sobre la respuesta HTTP en un test de nivel
superior).

---

## B. Cleanup de bajo impacto (seguro, sin cambio de comportamiento)

### B1. `New*` vs modelo legado — **requiere decisión de datos**

`NewQuestionEntity` / `NewSelectionEntity` / `NewTranslationEntity` /
`NewUserResponseEntity` (tablas `new_*`) + sus 4 repos + 3 casos de uso
(`CreateUserResponsesNewFormsUc`, `FindOnboardingQuestionaryNewFormsUc`,
`FindUserNewFormsResponseByUserUc`) duplican el árbol
`Question/Selection/Translation/UserResponse`.

**Riesgo real, no solo duplicación:** `FindReportUc` lee de
`new_user_responses` mientras `CreateMigraineLogUc` escribe en `user_responses`.
El camino de escritura y el de reporte usan tablas distintas.

Hace falta decidir cuál es el modelo canónico y:

- migrar los datos de una tabla a la otra,
- reapuntar todos los repos/casos de uso al modelo elegido,
- borrar el árbol muerto y sus migraciones (o marcarlas como _deprecated_).

### B2. `lambda-bootstrap` compartido

`ensureDataSourceInitialized` está copiado en 8 archivos (2 helpers de
`adapter/lambda`, 3 crons, 1 consumer de cola, 3 triggers de Cognito). El bloque
`logger.error(...) + Sentry.captureException(...) + Sentry.flush(2000)` está
copiado en 5.

Recomendado: `export const ensureDataSourceInitialized` en
`infra/database/dataSource.ts` y `adapter/lambda/bootstrap.ts` con
`reportLambdaError(domain, err, message, extra?)` + `flushSentry()`. No se hizo
ahora porque los `jest.mock('@/infra/database/dataSource', () => ({ dataSource:
{…} }))` de ~5 tests de Lambda tendrían que añadir la nueva export al factory
del mock.

### B3. Casos de uso no ruteados

`CreateUserUc`, `UpdateUserUc`, `ChangeUserEmailUc`, `FindUserUc`,
`FindProfileUc`, `CreateSessionUc`/`CreateSessionsUc`, `CreateDeviceUc`,
`FindDevicesUc`, `Create/FindQuestion(s)`, `Create/FindSelection(s)`,
`Create/FindTranslation(s)`, `Find*MigraineLog(s)`, `Find*PreventiveTreatment(s)`,
`CreateUserResponse(s)`, `FindMigraineLog/PreventiveTreatment Form(s)` y los
`*NewForms` **no están conectados** a ninguna ruta HTTP ni Lambda. Solo los
ejercitan sus tests. Decidir por cada uno: exponerlo (ruta + wiring) o eliminarlo
con su test. Mantenerlos "por si acaso" infla la superficie de mantenimiento y
la cobertura.

### B4. `id: string | null` en el dominio

Las entidades de dominio exponen `get id(): string | null`, lo que obliga a
`as string` en cada consumidor (`question.id as string`,
`reminderBeforeLog as number`, etc.). Alternativa: dos tipos —
`NewX` (sin id) y `PersistedX` (con `id: string`) — o un _branded type_
`EntityId`. Elimina decenas de casts pero toca todo el dominio y sus tests.

### B5. `leftJoinAndSelect('ml.user')` innecesario

`FindCalendarViewUc` y `FindMigraineLogsUc` traen la fila completa de `users`
por cada log solo para leer un `user.id` que ya es el filtro. Quitar el join
(o cambiarlo por `leftJoin` sin `AndSelect`) reduce columnas transferidas.
Verificar antes que ningún mapper (`toMigraineLogEntry`, `groupLogsByLocalDate`)
lea otro campo de `user`.

### B6. `WHERE x IS NULL OR x < :threshold`

`WeatherTileRepository.findTilesNeeding{History,Forecast}` — el `OR NULL` impide
usar un índice b-tree simple. Con volumen, cambiar a
`COALESCE(x, 'epoch') < :threshold` con índice sobre la expresión, o dos
consultas `UNION`.

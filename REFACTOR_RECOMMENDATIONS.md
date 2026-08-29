# Recomendaciones de refactor pendientes

Este documento recoge los hallazgos de la auditoría de arquitectura que **no**
se aplicaron todavía, con su justificación y una estrategia concreta. Se separan
en dos grupos: los que cambian comportamiento observable (requieren decisión de
producto y reescritura de tests) y los que son puro _cleanup_ de bajo impacto.

Lo que **sí** se aplicó (behaviour-preserving, ya en `main`):

| Commit                                  | Cambio                                                                                                                             |
| --------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| `BaseRepository<T>`                     | 24 repositorios colapsados a `extends BaseRepository<XEntity>` (−732 LOC)                                                          |
| `buildRepositories`                     | Punto único de ensamblado de repositorios; adoptado por `build-app.ts`, las 5 Lambdas de cron/cola y los 3 triggers de Cognito     |
| `classifyError`                         | Única fuente de verdad para el mapeo de errores; `handle-error-response.ts` y `adapter/http/error-handler.ts` delegan en ella      |
| `persistUserResponses`                  | Bucle de persistencia de respuestas + `upsertPreferredAnswerIfAbsent` hoisteados a `UserResponseBaseUc` (dedupe en 3 casos de uso) |
| cleanup                                 | Se eliminó `resolveRequestUser` (código muerto); `console.log` → `logger` en triggers                                              |
| `domain/patterns.ts` + `parseDateRange` | Regexes de formato y parseo de rango de fechas centralizados                                                                       |

---

## A. Cambios que alteran comportamiento (hacer como PRs revisados aparte)

### A1. Transacciones en casos de uso con múltiples escrituras

**Problema.** `CreateMigraineLogUc` y `CreatePreventiveTreatmentUc` insertan la
fila padre y luego, en un bucle, N `user_responses` + upserts de
`preferred_answers` + posibles `selections`/`translations` custom, **sin
transacción**. Un fallo a mitad del bucle deja un log/tratamiento huérfano con
respuestas parciales. `CreateUserResponsesNewFormsUc` es el único que sí usa
`dataSource.transaction`.

**Por qué no se hizo ahora.** Una transacción correcta exige reconstruir los
repositorios contra el `EntityManager` de la transacción. Eso obliga a:

- Añadir un `DataSource` al constructor de ambos casos de uso (rompe la firma
  usada por `build-app.ts` y por los tests unitarios, que inyectan mocks de
  repositorio directamente).
- Rediseñar `UserResponseBaseUc` para operar sobre repos _manager-bound_ dentro
  del `execute`.
- Reescribir `test/usecase/create-migraine-log.uc.test.ts` (314 líneas) y
  `test/usecase/create-preventive-treatment.uc.test.ts` para mockear al nivel de
  `DataSource.transaction` / `manager.getRepository`, como ya hace
  `test/usecase/create-user-responses-new-forms.uc.test.ts`.

**Estrategia recomendada.**

1. Introducir `TransactionalUserResponseBaseUc` que reciba `DataSource` y exponga
   `protected runInResponseTransaction(fn: (repos: ResponseRepos) => Promise<T>)`,
   donde `ResponseRepos` son instancias construidas con
   `manager.getRepository(...)`. Portar `loadQuestion` / `resolveAnswer` /
   `persistUserResponses` para que reciban `repos` como parámetro en vez de leer
   `this.*`.
2. `CreateMigraineLogUc.execute`: envolver "crear log + persistUserResponses" en
   `runInResponseTransaction`. Dejar `detectRecurrentSymptoms` +
   notificaciones **fuera** de la transacción (ver A3).
3. Idem `CreatePreventiveTreatmentUc`.
4. Adaptar los dos tests al patrón `manager.getRepository` de new-forms.
5. `build-app.ts`: pasar `dataSource` (ya disponible en el `if`) al constructor.

### A2. Autorización por propietario (`:userId` vs identidad del JWT)

**Problema.** Solo `DELETE /users/me` deriva la identidad del token. El resto de
rutas _user-scoped_ (`/users/:userId/profiles`, `/users/:userId/migraine-logs`,
`/users/:userId/preventive-treatments`, `/users/:userId/calendar-view`,
`/users/:userId/preferred-answers…`) **no tienen auth**: cualquier llamante pasa
cualquier `:userId`.

**Por qué no se hizo ahora.** Añadir `{ onRequest: [app.authenticate] }` +
guardia de propiedad a esas rutas hace que **toda** la suite de integración y
e2e falle con 401 (hoy llaman sin `Authorization`). Requiere:

- `test/integration/http-endpoints.integration.test.ts`: emitir un token
  verificable por el `cognitoJwtVerifier` mock (ya devuelve `{ sub: token }`),
  usando `Authorization: Bearer <externalId>` con `externalId` = el del usuario
  creado por el helper.
- `test/e2e/full-flow.e2e.test.ts` y su harness (necesita un JWT válido o un
  verifier mock inyectado).
- `test/adapter/http/routes.test.ts`.

**Estrategia recomendada.**

1. En `registerAuth`, además del `authenticate` actual, exponer
   `app.authenticateOwner` que corre `authenticate` y luego compara
   `request.user.id` con `request.params.userId`, lanzando
   `AppError(403, 'FORBIDDEN', …)` si difieren.
2. Aplicar `{ onRequest: [app.authenticateOwner] }` a cada ruta `:userId`.
3. Mantener `TerraController` (webhook de terceros, se autentica por firma) y
   `/app-version`, `/acute-treatment-worse-feedback-options` (públicas) sin
   cambios.
4. Actualizar los 3 archivos de test citados para autenticar cada request.
5. Considerar de paso derivar `userId` del token en vez del path param, y quitar
   `:userId` de la ruta (elimina la clase entera de bug). Es más invasivo pero
   más seguro.

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

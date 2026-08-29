# Changelog

Todos los cambios notables de este proyecto se documentan en este archivo.

El formato sigue [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/) y este
proyecto adhiere a [Semantic Versioning](https://semver.org/lang/es/).

## [1.1.0] - 2026-08-29

> Nota: la autorización de `/users/:userId/*` es un cambio incompatible para
> clientes existentes (pasan de sin auth a `401`/`403`).

### Changed

- **BREAKING — autorización**: las rutas `/users/:userId/*` (perfiles,
  `migraine-logs`, `preventive-treatments`, `calendar-view`, `preferred-answers`)
  ahora exigen un `Authorization: Bearer <token>` válido cuyo usuario coincida con
  `:userId`. Devuelven `401` sin token / token inválido y `403` si el token es de
  otro usuario. Antes no tenían autenticación. `/app-version`,
  `/acute-treatment-worse-feedback-options` y `/terra/webhook` siguen públicas.
- La creación de log de migraña y de tratamiento preventivo se ejecuta dentro de
  una transacción de base de datos: un fallo a mitad de la persistencia de
  respuestas ya no deja filas huérfanas.

### Refactor (sin cambio de comportamiento)

- 24 repositorios colapsados en `BaseRepository<T>` (−732 LOC).
- Punto único de ensamblado de repositorios (`factory/container.ts`), adoptado por
  el factory HTTP, las Lambdas de cron/cola y los triggers de Cognito.
- Mapeo de errores unificado en `utils/error-mapping.ts#classifyError`.
- Pipeline de persistencia de respuestas + patrones de fecha/regex centralizados.
- Ver `REFACTOR_RECOMMENDATIONS.md` para los hallazgos aún pendientes.

## [1.0.0] - 2026-08-28

### Added

- Dominio de **usuarios y perfiles**: alta/edición de perfil, sincronización de
  atributos con Cognito y borrado de cuenta autenticado (`DELETE /users/me`).
- **Registro de migrañas** (`migraine-logs`): intensidad, ubicación del dolor,
  duración, respuestas a cuestionario asociado, y vista de calendario agrupada por
  fecha local (`calendar-view`).
- **Tratamientos preventivos y agudos**: alta de tratamientos recurrentes con
  recordatorios (`preventive-treatments`) y feedback de tratamientos aplicados durante
  una crisis (`acute-treatment-feedback`).
- **Cuestionarios de onboarding**: preguntas, opciones de respuesta y respuestas
  preferidas por usuario (`preferred-answers`), con soporte multi-idioma
  (`translations`).
- **Dispositivos y notificaciones push**: registro de dispositivos y tokens push por
  usuario.
- **Reportes**: agregaciones de frecuencia, intensidad y duración de migrañas, top de
  triggers/síntomas/tratamientos, distribución por día de semana y promedios
  mensuales (`FindReportUc`).
- **Integración con wearables (Terra)**: webhook para ingesta de datos crudos,
  persistidos vía `MultiDestinationDataProcessor` (Postgres, S3, DocumentDB).
- **Job de agregación diaria**: tabla `user_daily_vitals` y batch job que consolida
  datos de wearables por usuario y día.
- **Validación de entrada HTTP con Joi** en todos los endpoints (`src/controller/schemas/`),
  como capa de sanitización previa a las reglas de negocio del dominio.
- **Infraestructura como código** con Serverless Framework (`serverless.yml`): un rol
  IAM de mínimo privilegio por función Lambda, colas SQS, tópicos SNS, buckets S3 y
  tabla DynamoDB provisionados como parte del stack.
- **Suite de tests**: unitarios (Jest), de integración contra Postgres real (Docker) y
  end-to-end del flujo completo registro → perfil → onboarding → log → notificación
  (Docker Compose + LocalStack).
- **CI en GitHub Actions**: lint, type-check y tests con gate de cobertura del 80% en
  las capas de dominio y casos de uso.
- **Documentación**: `README.md` (setup local containerizado y no containerizado,
  variables de entorno, scripts, deploy), `ARCHITECTURE.md` (capas y reglas de
  dependencia), `openapi.yml` (contrato de la API) y `SECURITY.md` (política de
  reporte de vulnerabilidades).

[1.1.0]: https://github.com/antoniojvargas/migraine-controll-api/releases/tag/v1.1.0
[1.0.0]: https://github.com/antoniojvargas/migraine-controll-api/releases/tag/v1.0.0

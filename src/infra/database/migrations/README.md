# Migraciones

Directorio de migraciones de PostgreSQL ejecutadas con la CLI de TypeORM.

## Cómo generar una migración

```bash
npm run migration:generate -- src/infra/database/migrations/<Descripcion>
```

El CLI agrega el timestamp automáticamente, de modo que el archivo resultante
sigue el patrón `Descripcion<timestamp>.ts` (ej. `CreateUsers1735678901234.ts`).
Usa **PascalCase** para la descripción y resúmela en el nombre (ej.
`CreateUsers`, `AddUserSessions`, `DropLegacyColumn`).

## Comandos

| Comando                                                                     | Descripción                                                |
| --------------------------------------------------------------------------- | ---------------------------------------------------------- |
| `npm run migration:generate -- src/infra/database/migrations/<Descripcion>` | Genera una migración desde el diff contra la base de datos |
| `npm run migration:run`                                                     | Aplica las migraciones pendientes                          |
| `npm run migration:revert`                                                  | Revierte la última migración aplicada                      |

Todos requieren un `.env` (copiar desde `.env.example`) y una instancia de
PostgreSQL accesible. Los cambios de esquema siempre se hacen vía migraciones,
nunca con `synchronize: true`.

## Convenciones

- **Idempotencia**: cada migración debe poder repetirse sin romper la base.
  Antes de crear/eliminar tablas, columnas, índices o constraints, consulta
  `information_schema` como guarda:

```ts
const tableExists = await queryRunner.query(
  `SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'users'`,
);
if (tableExists.length > 0) {
  return;
}
```

- **Nombres descriptivos**: el nombre del archivo debe resumir el cambio para
  permitir leer el historial de migraciones de un vistazo.
- **No editar migraciones ya aplicadas**: una vez ejecutada (`migration:run`),
  una migración es inmutable; si necesita cambios, genera una nueva.

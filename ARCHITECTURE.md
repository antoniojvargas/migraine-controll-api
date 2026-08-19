# Arquitectura

Este proyecto sigue una arquitectura en capas (inspirada en Clean Architecture) para mantener el dominio aislado de detalles de infraestructura y frameworks.

## Capas

### `src/domain`

Entidades y reglas de negocio puras. No depende de ningún framework, base de datos ni librería externa. Es el núcleo de la aplicación.

### `src/usecase`

Casos de uso (aplicación de las reglas de negocio). Orquestan entidades del dominio para cumplir una acción concreta (ej. "crear registro de migraña"). Dependen del dominio, nunca de infraestructura o frameworks.

### `src/dto`

Data Transfer Objects: estructuras de datos usadas para entrada/salida entre capas (request/response, payloads), separadas de las entidades de dominio.

### `src/controller`

Punto de entrada HTTP (o el que corresponda). Recibe requests, valida/transforma con DTOs, invoca casos de uso y devuelve la respuesta. Aquí vive el manejo de errores de entrada (try/catch).

### `src/adapter`

Adaptadores que traducen entre el mundo externo (frameworks, APIs de terceros, mensajería) y las interfaces que espera la aplicación. Implementan los "puertos" definidos por el dominio/casos de uso.

### `src/infra`

Detalles de infraestructura: conexión a base de datos, clientes AWS (DynamoDB, SQS, SNS, etc.), configuración de servidores externos. Implementaciones concretas que los adapters/usecases consumen a través de interfaces.

### `src/factory`

Construcción y ensamblado de dependencias (inyección de dependencias manual). Centraliza la creación de instancias de usecases, adapters e infra para desacoplar el resto del código de los detalles de instanciación.

### `src/config`

Configuración de la aplicación: variables de entorno, constantes globales, configuración de librerías.

### `src/utils`

Funciones utilitarias genéricas y reutilizables sin lógica de negocio (formateo, validaciones genéricas, helpers).

### `test`

Pruebas automatizadas (unitarias, integración) del proyecto.

## Regla de dependencias

Las dependencias deben apuntar siempre hacia el dominio:

```
controller -> usecase -> domain
adapter/infra -> (implementan interfaces usadas por) usecase/domain
factory -> ensambla todo
```

El dominio y los casos de uso no deben importar nada de `infra`, `adapter` ni frameworks externos.

## Indexación

Los índices compuestos respaldan los patrones de consulta más frecuentes y
siguen la regla general **`(owner_id, columna_de_orden_o_filtro)`**: primero la
columna de filtro (FK de propietario) y luego la columna que ordena o filtra
dentro de ese propietario.

Índices actuales:

| Tabla                            | Índice                                    | Consulta que respalda                                   |
| -------------------------------- | ----------------------------------------- | ------------------------------------------------------- |
| `migraine_logs`                  | `(user_id, started_at)`                   | Historial de migrañas de un usuario ordenado por inicio |
| `preventive_treatment_schedules` | `(preventive_treatment_id, scheduled_at)` | Agenda de un tratamiento ordenada por hora              |
| `user_responses`                 | `(user_id, question_id)`                  | Respuestas de un usuario a una pregunta                 |

Notas:

- `profiles.user_id` ya queda indexado por el constraint `UNIQUE` de la relación
  1:1 con `users`, no requiere índice adicional.
- Las FKs individuales se indexan con `@Index()` en la propiedad de la relación;
  los índices compuestos de consulta se declaran con `@Index` a nivel de clase
  de la entidad.
- No se agregan índices especulativos: solo los que respaldan consultas reales
  o patrones de acceso conocidos.

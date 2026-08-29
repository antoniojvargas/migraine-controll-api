# Política de seguridad

## Versiones soportadas

Este proyecto se despliega de forma continua desde `main`. Solo la última versión
desplegada recibe parches de seguridad; no se mantienen versiones anteriores.

## Reportar una vulnerabilidad

Si encontrás una vulnerabilidad de seguridad en este repositorio, por favor **no abras
un issue público**. Reportala de forma privada a:

- **Email**: toyoyo600@gmail.com

Incluí en el reporte, en la medida de lo posible:

- Una descripción del problema y su impacto potencial.
- Pasos para reproducirlo (endpoint, payload, headers relevantes).
- Versión/commit afectado.

## Qué esperar

- **Confirmación de recepción**: dentro de las 48 horas hábiles siguientes al reporte.
- **Evaluación inicial**: dentro de los 5 días hábiles, se confirma si el reporte es
  válido y su severidad estimada.
- **Resolución**: los tiempos dependen de la severidad, priorizando issues críticos
  (RCE, bypass de autenticación/autorización, exposición de datos de salud de
  usuarios) sobre hallazgos de menor impacto.
- **Divulgación**: se coordina con quien reporta antes de hacer pública cualquier
  información sobre la vulnerabilidad, una vez desplegado el fix.

## Alcance

Están dentro de alcance:

- El código de esta API (`src/`), su configuración de infraestructura
  (`serverless.yml`, `Dockerfile`, `docker-compose*.yml`) y sus dependencias directas.

Están fuera de alcance:

- Ataques de denegación de servicio (DoS/DDoS).
- Ingeniería social contra mantenedores o usuarios.
- Vulnerabilidades en dependencias de terceros sin un vector de explotación
  concreto contra este servicio (reportalas directamente al proyecto upstream).

## Buenas prácticas del proyecto

- Los secretos (credenciales de base de datos, JWT, IDs de Cognito, etc.) se inyectan
  siempre vía variables de entorno; nunca se commitean. Ver `.env.example` y
  `secrets.example.yml` como plantillas.
- Todos los endpoints HTTP validan su entrada con esquemas Joi antes de llegar a la
  capa de dominio (`src/controller/schemas/`).
- Los roles IAM de cada Lambda siguen el principio de mínimo privilegio: un rol por
  función, con acciones y recursos acotados a lo que esa función necesita
  (`serverless.yml`).

/**
 * Expresiones regulares de formato compartidas. Viven en `domain` porque son
 * reglas de formato del negocio; tanto `domain/validation.ts` como los esquemas
 * Joi de la capa HTTP (`controller/schemas/`) las importan desde aquí para no
 * mantener copias que puedan divergir.
 */
export const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const SEMVER_PATTERN = /^\d+\.\d+\.\d+$/;
export const GEOHASH6_PATTERN = /^[0-9a-z]{6}$/i;
export const LANGUAGE_PATTERN = /^[a-z]{2,3}$/i;

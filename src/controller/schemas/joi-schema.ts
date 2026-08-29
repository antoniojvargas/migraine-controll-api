import Joi from 'joi';
import { RequestSchema } from '@/controller/utils';

/**
 * Adapta un ObjectSchema de Joi a la interfaz RequestSchema<T> ya usada por
 * executeController/validateRequest. Se validan siempre con:
 * - abortEarly: false -> junta todos los errores en un solo mensaje
 * - stripUnknown: true -> descarta propiedades no declaradas (evita mass assignment)
 * - convert: true -> permite coerciones seguras (ej. querystrings string -> number)
 */
export function joiSchema<T>(schema: Joi.Schema): RequestSchema<T> {
  return {
    validate(data: unknown) {
      const { value, error } = schema.validate(data, {
        abortEarly: false,
        stripUnknown: true,
        convert: true,
      });
      if (error !== undefined) {
        return { value: value as T, error: { message: error.message } };
      }
      return { value: value as T };
    },
  };
}

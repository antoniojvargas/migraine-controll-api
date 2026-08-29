import Joi from 'joi';
import { RequestSchema } from '@/controller/utils';
import { joiSchema } from './joi-schema';

// Sin restricción de versión: coincide con el UUID_REGEX genérico que ya
// usaban los controllers (8-4-4-4-12 hex), no solo uuid v4.
export const uuidJoi = Joi.string().guid();

/** Valida un único param de ruta como uuid v4, ej. { userId } o { questionId }. */
export function uuidParamSchema(field: string): RequestSchema<Record<string, string>> {
  return joiSchema(
    Joi.object({
      [field]: uuidJoi.required(),
    }),
  );
}

export function uuidParamsSchema(fields: string[]): RequestSchema<Record<string, string>> {
  const shape: Record<string, Joi.Schema> = {};
  for (const field of fields) {
    shape[field] = uuidJoi.required();
  }
  return joiSchema(Joi.object(shape));
}

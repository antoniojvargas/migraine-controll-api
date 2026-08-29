import Joi from 'joi';
import { TerraWebhookPayloadDto } from '@/dto/terra-webhook-payload.dto';
import { joiSchema } from './joi-schema';

// El payload de Terra trae campos propios de cada proveedor de wearable que no
// controlamos (ver TerraWebhookDataItemDto). Por eso los items de "data" y el
// payload completo permiten claves desconocidas (.unknown(true)): solo se
// sanitiza la forma de los campos que sí usamos (type, user, metadata).
const terraDataItemSchema = Joi.object({
  metadata: Joi.object({
    start_time: Joi.string(),
    end_time: Joi.string(),
  }).unknown(true),
}).unknown(true);

export const terraWebhookBodySchema = joiSchema<TerraWebhookPayloadDto>(
  Joi.object({
    type: Joi.string().trim().min(1).required(),
    user: Joi.object({
      user_id: Joi.string(),
      provider: Joi.string(),
    }).unknown(true),
    data: Joi.array().items(terraDataItemSchema),
  }).unknown(true),
);

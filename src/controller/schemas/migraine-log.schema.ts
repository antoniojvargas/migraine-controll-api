import Joi from 'joi';
import { CreateMigraineLogInputDto } from '@/dto/create-migraine-log-input.dto';
import { INTENSITY_MAX, INTENSITY_MIN } from '@/domain/constants';
import { joiSchema } from './joi-schema';
import { uuidJoi } from './common.schema';
import { userResponsesArraySchema } from './user-response.schema';

type CreateMigraineLogBody = Omit<CreateMigraineLogInputDto, 'userId'>;

export const createMigraineLogBodySchema = joiSchema<CreateMigraineLogBody>(
  Joi.object({
    sessionId: uuidJoi.allow(null),
    intensity: Joi.number().integer().min(INTENSITY_MIN).max(INTENSITY_MAX).required(),
    painLocation: Joi.string().trim().min(1).required(),
    startedAt: Joi.string().isoDate().required(),
    endedAt: Joi.string().isoDate().allow(null),
    responses: userResponsesArraySchema,
  }),
);

import Joi from 'joi';
import { CreatePreventiveTreatmentInputDto } from '@/dto/create-preventive-treatment-input.dto';
import { TREATMENT_NAME_MAX_LENGTH } from '@/domain/constants';
import { joiSchema } from './joi-schema';
import { userResponsesArraySchema } from './user-response.schema';

type CreatePreventiveTreatmentBody = Omit<CreatePreventiveTreatmentInputDto, 'userId'>;

export const createPreventiveTreatmentBodySchema = joiSchema<CreatePreventiveTreatmentBody>(
  Joi.object({
    name: Joi.string().trim().min(1).max(TREATMENT_NAME_MAX_LENGTH).required(),
    isRecurrent: Joi.boolean(),
    repeatUntil: Joi.string().isoDate().allow(null),
    responses: userResponsesArraySchema,
  }),
);

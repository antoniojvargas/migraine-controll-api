import Joi from 'joi';
import { joiSchema } from './joi-schema';
import { uuidJoi } from './common.schema';

interface PreferredAnswerBody {
  selectionId?: string;
  answerText?: string;
}

export const preferredAnswerBodySchema = joiSchema<PreferredAnswerBody>(
  Joi.object({
    selectionId: uuidJoi,
    answerText: Joi.string().trim().min(1),
  })
    .or('selectionId', 'answerText')
    .messages({
      'object.missing': 'answerText is required when selectionId is not provided',
    }),
);

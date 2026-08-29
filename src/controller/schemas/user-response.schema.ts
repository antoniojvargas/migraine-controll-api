import Joi from 'joi';
import { MAX_ANSWER_TEXT_LENGTH } from '@/domain/constants';
import { uuidJoi } from './common.schema';

/**
 * Forma común de las respuestas embebidas al crear un migraine-log o
 * preventive-treatment (CreateUserResponsesInputDto['responses'] sin
 * userId/migraineLogId/preventiveTreatmentId, que los asigna el usecase).
 */
export const userResponseItemSchema = Joi.object({
  questionId: uuidJoi.required(),
  answerId: uuidJoi.allow(null),
  answerText: Joi.string().trim().max(MAX_ANSWER_TEXT_LENGTH).allow(null),
  answerLanguageCode: Joi.string().trim().min(2).max(3),
});

export const userResponsesArraySchema = Joi.array().items(userResponseItemSchema);

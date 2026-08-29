import Joi from 'joi';
import { FindAppVersionInputDto } from '@/dto/find-app-version.dto';
import { joiSchema } from './joi-schema';

const SEMVER_PATTERN = /^\d+\.\d+\.\d+$/;

export const appVersionQuerySchema = joiSchema<FindAppVersionInputDto>(
  Joi.object({
    platform: Joi.string().trim().min(1).required(),
    currentVersion: Joi.string().pattern(SEMVER_PATTERN).required().messages({
      'string.pattern.base': 'currentVersion must be a valid semver string',
    }),
  }),
);

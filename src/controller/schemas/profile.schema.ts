import Joi from 'joi';
import { CreateProfileDto } from '@/dto/create-profile.dto';
import { UpdateProfileInputDto } from '@/dto/update-profile-input.dto';
import { LATITUDE_MAX, LATITUDE_MIN, LONGITUDE_MAX, LONGITUDE_MIN } from '@/domain/constants';
import { joiSchema } from './joi-schema';

const SEMVER_PATTERN = /^\d+\.\d+\.\d+$/;
const GEOHASH6_PATTERN = /^[0-9a-z]{6}$/i;
const LANGUAGE_PATTERN = /^[a-z]{2,3}$/i;
const GENDERS = ['f', 'm', 'nb'] as const;

type CreateProfileBody = Omit<CreateProfileDto, 'userId'>;
type UpdateProfileBody = Omit<UpdateProfileInputDto, 'userId'>;

export const createProfileBodySchema = joiSchema<CreateProfileBody>(
  Joi.object({
    name: Joi.string().trim().min(1).required(),
    gender: Joi.string()
      .valid(...GENDERS)
      .required(),
    birthDate: Joi.string().isoDate().required(),
    language: Joi.string().pattern(LANGUAGE_PATTERN).required(),
    geohash6: Joi.string().pattern(GEOHASH6_PATTERN),
    latitude: Joi.number().min(LATITUDE_MIN).max(LATITUDE_MAX),
    longitude: Joi.number().min(LONGITUDE_MIN).max(LONGITUDE_MAX),
    appVersion: Joi.string().pattern(SEMVER_PATTERN),
    hasTakenSurvey: Joi.boolean(),
  }),
);

export const updateProfileBodySchema = joiSchema<UpdateProfileBody>(
  Joi.object({
    name: Joi.string().trim().min(1),
    gender: Joi.string().valid(...GENDERS),
    birthDate: Joi.string().isoDate(),
    language: Joi.string().pattern(LANGUAGE_PATTERN),
    geohash6: Joi.string().pattern(GEOHASH6_PATTERN),
    appVersion: Joi.string().pattern(SEMVER_PATTERN).allow(null),
    hasTakenSurvey: Joi.boolean(),
  }),
);

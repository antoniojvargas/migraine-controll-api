import Joi from 'joi';
import { joiSchema } from './joi-schema';

interface CalendarViewQuery {
  from?: string;
  to?: string;
  timezone?: string;
}

export const calendarViewQuerySchema = joiSchema<CalendarViewQuery>(
  Joi.object({
    from: Joi.string().isoDate(),
    to: Joi.string().isoDate(),
    timezone: Joi.string().trim().min(1).max(64),
  }),
);

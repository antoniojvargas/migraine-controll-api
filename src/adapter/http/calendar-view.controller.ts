import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { executeController, validateRequest } from '@/controller/utils';
import { FindCalendarViewUc } from '@/usecase/find-calendar-view.uc';
import { uuidParamSchema } from '@/controller/schemas/common.schema';
import { calendarViewQuerySchema } from '@/controller/schemas/calendar-view.schema';

interface CalendarViewQuery {
  from?: string;
  to?: string;
  timezone?: string;
}

export class CalendarViewController {
  constructor(private readonly findCalendarViewUc: FindCalendarViewUc) {}

  find = async (
    request: FastifyRequest<{ Params: { userId: string }; Querystring: CalendarViewQuery }>,
    reply: FastifyReply,
  ): Promise<FastifyReply> =>
    executeController(reply, async () => {
      const { userId } = validateRequest(uuidParamSchema('userId'), request.params);
      const query = validateRequest(calendarViewQuerySchema, request.query);
      const data = await this.findCalendarViewUc.execute({
        userId,
        from: query.from,
        to: query.to,
        timezone: query.timezone,
      });
      return { data };
    });
}

export const registerCalendarViewRoutes = (
  app: FastifyInstance,
  controller: CalendarViewController,
): void => {
  app.get('/users/:userId/calendar-view', controller.find);
};

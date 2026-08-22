import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { executeController } from '@/controller/utils';
import { FindCalendarViewUc } from '@/usecase/find-calendar-view.uc';

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
      const data = await this.findCalendarViewUc.execute({
        userId: request.params.userId,
        from: request.query.from,
        to: request.query.to,
        timezone: request.query.timezone,
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

import { Session } from '@/domain/session';
import { CreateSessionsInputDto } from '@/dto/create-sessions-input.dto';
import { SessionOutputDto } from '@/dto/session-output.dto';
import { handleErrorResponse } from '@/utils/handle-error-response';
import { UseCaseInterface } from './usecase.interface';
import { SessionBaseUc } from './session-base.uc';

export class CreateSessionsUc
  extends SessionBaseUc
  implements UseCaseInterface<CreateSessionsInputDto, SessionOutputDto[]>
{
  execute = async (input: CreateSessionsInputDto): Promise<SessionOutputDto[]> => {
    try {
      const sessions = input.sessions.map((dto) => Session.createNewSession(dto));
      const entities = sessions.map((session) => this.mapToEntity(session));
      const persisted = await this.sessionRepository.bulkCreate(entities);
      sessions.forEach((session, index) => session.assignId(persisted[index].id));
      return sessions.map((session) => this.toOutput(session));
    } catch (error) {
      handleErrorResponse(error);
    }
  };
}

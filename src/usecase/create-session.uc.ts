import { Session } from '@/domain/session';
import { CreateSessionDto } from '@/dto/create-session.dto';
import { SessionOutputDto } from '@/dto/session-output.dto';
import { handleErrorResponse } from '@/utils/handle-error-response';
import { UseCaseInterface } from './usecase.interface';
import { SessionBaseUc } from './session-base.uc';

export class CreateSessionUc
  extends SessionBaseUc
  implements UseCaseInterface<CreateSessionDto, SessionOutputDto>
{
  execute = async (input: CreateSessionDto): Promise<SessionOutputDto> => {
    try {
      const session = Session.createNewSession(input);
      const persisted = await this.sessionRepository.create(this.mapToEntity(session));
      session.assignId(persisted.id);
      return this.toOutput(session);
    } catch (error) {
      handleErrorResponse(error);
    }
  };
}

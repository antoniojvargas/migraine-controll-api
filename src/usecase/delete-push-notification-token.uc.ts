import { PushNotificationTokenRepository } from '@/infra/database/repository/push-notification-token.repository';
import { DeletePushNotificationTokenInputDto } from '@/dto/delete-push-notification-token-input.dto';
import { requireNonEmpty } from '@/domain/validation';
import { AppError } from '@/utils/app-error';
import { handleErrorResponse } from '@/utils/handle-error-response';
import { UseCaseInterface } from './usecase.interface';

export class DeletePushNotificationTokenUc implements UseCaseInterface<
  DeletePushNotificationTokenInputDto,
  void
> {
  private readonly repository: PushNotificationTokenRepository;

  constructor(repository: PushNotificationTokenRepository) {
    this.repository = repository;
  }

  execute = async (input: DeletePushNotificationTokenInputDto): Promise<void> => {
    try {
      const userId = requireNonEmpty(input.userId, 'userId');
      const token = requireNonEmpty(input.token, 'token');

      const existing = await this.repository.findOneBy({ user: { id: userId }, token });
      if (existing === null) {
        throw new AppError(
          404,
          'PUSH_NOTIFICATION_TOKEN_NOT_FOUND',
          'Push notification token not found',
        );
      }
      await this.repository.delete({ user: { id: userId }, token });
    } catch (error) {
      handleErrorResponse(error);
    }
  };
}

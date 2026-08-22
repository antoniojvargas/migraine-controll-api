import { CognitoSignUpInputDto } from '@/dto/cognito-sign-up-input.dto';
import { UserRepository } from '@/infra/database/repository/user.repository';
import { AppError } from '@/utils/app-error';
import { UseCaseInterface } from './usecase.interface';

const EMAIL_CHANGE_COOLDOWN_DAYS = 30;
const EMAIL_CHANGE_COOLDOWN_MS = EMAIL_CHANGE_COOLDOWN_DAYS * 24 * 60 * 60 * 1000;

export class CognitoSignUpUc implements UseCaseInterface<CognitoSignUpInputDto, void> {
  constructor(private readonly userRepository: UserRepository) {}

  execute = async (input: CognitoSignUpInputDto): Promise<void> => {
    const email = input.email.toLowerCase();

    const existingUser = await this.userRepository.findOneBy({ email });
    if (existingUser !== null) {
      throw new AppError(409, 'EMAIL_ALREADY_REGISTERED', 'Ya existe una cuenta con este email');
    }

    const previousOwner = await this.userRepository.findOneBy({ originalEmail: email });
    if (previousOwner?.emailChangedAt == null) {
      return;
    }

    const elapsedMs = Date.now() - previousOwner.emailChangedAt.getTime();
    if (elapsedMs < EMAIL_CHANGE_COOLDOWN_MS) {
      throw new AppError(
        409,
        'EMAIL_CHANGE_COOLDOWN',
        'Este email no está disponible temporalmente para nuevos registros',
      );
    }
  };
}

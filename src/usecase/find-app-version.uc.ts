import { DomainError } from '@/domain/domain-error';
import { requireNonEmpty } from '@/domain/validation';
import { AppVersionRepository } from '@/infra/database/repository/app-version.repository';
import { AppVersionCheckOutputDto, FindAppVersionInputDto } from '@/dto/find-app-version.dto';
import { handleErrorResponse } from '@/utils/handle-error-response';
import { UseCaseInterface } from './usecase.interface';

const compareSemver = (a: string, b: string): number => {
  const pa = a.split('.').map(Number);
  const pb = b.split('.').map(Number);
  for (let i = 0; i < 3; i += 1) {
    if (pa[i] !== pb[i]) {
      return pa[i] - pb[i];
    }
  }
  return 0;
};

export class FindAppVersionUc implements UseCaseInterface<
  FindAppVersionInputDto,
  AppVersionCheckOutputDto
> {
  constructor(private readonly appVersionRepository: AppVersionRepository) {}

  execute = async (input: FindAppVersionInputDto): Promise<AppVersionCheckOutputDto> => {
    try {
      const platform = requireNonEmpty(input.platform, 'platform');
      const currentVersion = requireNonEmpty(input.currentVersion, 'currentVersion');
      const entity = await this.appVersionRepository.findOneBy({ platform });
      if (entity === null) {
        throw new DomainError(`Unsupported platform: ${platform}`);
      }
      const updateRequired =
        entity.forceUpdate && compareSemver(currentVersion, entity.version) < 0;
      return {
        platform: entity.platform,
        latestVersion: entity.version,
        forceUpdate: entity.forceUpdate,
        announcement: entity.announcement,
        updateRequired,
      };
    } catch (error) {
      handleErrorResponse(error);
    }
  };
}

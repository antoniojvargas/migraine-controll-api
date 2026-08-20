import { SUPPORTED_LANGUAGES } from '@/domain/constants';
import { requireNonEmpty, requireSupportedLanguage } from '@/domain/validation';
import { TranslationRepository } from '@/infra/database/repository/translation.repository';
import { TranslationEntity } from '@/infra/database/entities';
import { FindTranslationsInputDto } from '@/dto/find-translations-input.dto';
import { TranslationOutputDto } from '@/dto/translation-output.dto';
import { handleErrorResponse } from '@/utils/handle-error-response';
import { UseCaseInterface } from './usecase.interface';

export class FindTranslationsUc implements UseCaseInterface<
  FindTranslationsInputDto,
  TranslationOutputDto[]
> {
  constructor(private readonly translationRepository: TranslationRepository) {}

  execute = async (input: FindTranslationsInputDto): Promise<TranslationOutputDto[]> => {
    try {
      const selectionId = requireNonEmpty(input.selectionId, 'selectionId');
      const query = this.translationRepository
        .createQueryBuilder('translation')
        .leftJoinAndSelect('translation.selection', 'selection')
        .where('translation.selection_id = :selectionId', { selectionId });
      if (input.languageCode !== undefined) {
        query.andWhere('translation.language_code = :languageCode', {
          languageCode: requireSupportedLanguage(input.languageCode, SUPPORTED_LANGUAGES),
        });
      }
      const entities = await query.getMany();
      return entities.map((entity) => this.toOutput(entity));
    } catch (error) {
      handleErrorResponse(error);
    }
  };

  private toOutput(entity: TranslationEntity): TranslationOutputDto {
    return {
      id: entity.id,
      selectionId: entity.selection.id,
      languageCode: entity.languageCode,
      text: entity.text,
    };
  }
}

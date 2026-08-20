import { DeepPartial } from 'typeorm';
import { Translation } from '@/domain/translation';
import { TranslationRepository } from '@/infra/database/repository/translation.repository';
import { TranslationEntity } from '@/infra/database/entities';
import { CreateTranslationDto } from '@/dto/create-translation.dto';
import { TranslationOutputDto } from '@/dto/translation-output.dto';
import { handleErrorResponse } from '@/utils/handle-error-response';
import { UseCaseInterface } from './usecase.interface';

export class CreateTranslationUc implements UseCaseInterface<
  CreateTranslationDto,
  TranslationOutputDto
> {
  constructor(private readonly translationRepository: TranslationRepository) {}

  execute = async (input: CreateTranslationDto): Promise<TranslationOutputDto> => {
    try {
      const translation = Translation.createNewTranslation(input);
      const persisted = await this.translationRepository.create(this.mapToEntity(translation));
      translation.assignId(persisted.id);
      return {
        id: persisted.id,
        selectionId: translation.selectionId,
        languageCode: translation.languageCode,
        text: translation.text,
      };
    } catch (error) {
      handleErrorResponse(error);
    }
  };

  private mapToEntity(translation: Translation): DeepPartial<TranslationEntity> {
    return {
      selection: { id: translation.selectionId },
      languageCode: translation.languageCode,
      text: translation.text,
    };
  }
}

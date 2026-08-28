import { FindTranslationsUc } from '@/usecase/find-translations.uc';
import { TranslationRepository } from '@/infra/database/repository/translation.repository';
import { createQueryBuilderMock } from './helpers';

describe('FindTranslationsUc', () => {
  const build = (): { uc: FindTranslationsUc; translationRepository: TranslationRepository } => {
    const translationRepository = {
      createQueryBuilder: jest.fn(),
    } as unknown as TranslationRepository;
    return { uc: new FindTranslationsUc(translationRepository), translationRepository };
  };

  it('returns translations for a selection', async () => {
    const { uc, translationRepository } = build();
    (translationRepository.createQueryBuilder as jest.Mock).mockReturnValue(
      createQueryBuilderMock({
        getMany: [{ id: 'tr-1', languageCode: 'es', text: 'Visual', selection: { id: 'sel-1' } }],
      }),
    );

    const result = await uc.execute({ selectionId: 'sel-1' });

    expect(result).toEqual([
      { id: 'tr-1', selectionId: 'sel-1', languageCode: 'es', text: 'Visual' },
    ]);
  });

  it('filters by languageCode when provided', async () => {
    const { uc, translationRepository } = build();
    const queryBuilder = createQueryBuilderMock({ getMany: [] });
    (translationRepository.createQueryBuilder as jest.Mock).mockReturnValue(queryBuilder);

    await uc.execute({ selectionId: 'sel-1', languageCode: 'es' });

    expect(queryBuilder.andWhere).toHaveBeenCalledWith(
      'translation.language_code = :languageCode',
      {
        languageCode: 'es',
      },
    );
  });

  it('rejects an unsupported languageCode with 400', async () => {
    const { uc, translationRepository } = build();
    (translationRepository.createQueryBuilder as jest.Mock).mockReturnValue(
      createQueryBuilderMock({ getMany: [] }),
    );

    await expect(uc.execute({ selectionId: 'sel-1', languageCode: 'de' })).rejects.toMatchObject({
      statusCode: 400,
      code: 'DOMAIN_VALIDATION_ERROR',
    });
  });

  it('rejects a missing selectionId with 400', async () => {
    const { uc } = build();

    await expect(uc.execute({ selectionId: '' })).rejects.toMatchObject({
      statusCode: 400,
      code: 'DOMAIN_VALIDATION_ERROR',
    });
  });
});

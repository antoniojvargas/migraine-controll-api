import { CreateTranslationUc } from '@/usecase/create-translation.uc';
import { TranslationRepository } from '@/infra/database/repository/translation.repository';

describe('CreateTranslationUc', () => {
  const build = (): { uc: CreateTranslationUc; translationRepository: TranslationRepository } => {
    const translationRepository = { create: jest.fn() } as unknown as TranslationRepository;
    return { uc: new CreateTranslationUc(translationRepository), translationRepository };
  };

  it('creates a translation and returns the output', async () => {
    const { uc, translationRepository } = build();
    (translationRepository.create as jest.Mock).mockResolvedValue({ id: 'tr-1' });

    const result = await uc.execute({
      selectionId: 'sel-1',
      languageCode: 'es',
      text: 'Visual',
    });

    expect(result).toEqual({
      id: 'tr-1',
      selectionId: 'sel-1',
      languageCode: 'es',
      text: 'Visual',
    });
    expect(translationRepository.create).toHaveBeenCalledWith({
      selection: { id: 'sel-1' },
      languageCode: 'es',
      text: 'Visual',
    });
  });

  it('rejects an unsupported language code with 400', async () => {
    const { uc } = build();

    await expect(
      uc.execute({ selectionId: 'sel-1', languageCode: 'de', text: 'Visual' }),
    ).rejects.toMatchObject({ statusCode: 400, code: 'DOMAIN_VALIDATION_ERROR' });
  });

  it('rejects text exceeding the max length with 400', async () => {
    const { uc } = build();

    await expect(
      uc.execute({ selectionId: 'sel-1', languageCode: 'es', text: 'a'.repeat(201) }),
    ).rejects.toMatchObject({ statusCode: 400, code: 'DOMAIN_VALIDATION_ERROR' });
  });
});

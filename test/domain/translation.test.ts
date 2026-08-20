import { Translation } from '@/domain/translation';
import { DomainError } from '@/domain/domain-error';

const validDto = () => ({ selectionId: 'sel-1', languageCode: 'ES', text: 'Opción A' });

describe('Translation domain', () => {
  it('creates a valid translation and normalizes language', () => {
    const translation = Translation.createNewTranslation(validDto());

    expect(translation.id).toBeNull();
    expect(translation.languageCode).toBe('es');
    expect(translation.text).toBe('Opción A');
    expect(translation.selectionId).toBe('sel-1');
  });

  it.each(['', 'de', 'fr', 'en-US', 'es_ES'])('rejects unsupported language %p', (languageCode) => {
    expect(() => Translation.createNewTranslation({ ...validDto(), languageCode })).toThrow(
      DomainError,
    );
  });

  it('rejects an empty text', () => {
    expect(() => Translation.createNewTranslation({ ...validDto(), text: ' ' })).toThrow(
      DomainError,
    );
  });

  it('rejects text longer than the cap', () => {
    expect(() =>
      Translation.createNewTranslation({ ...validDto(), text: 'x'.repeat(201) }),
    ).toThrow(DomainError);
  });

  it('accepts text at the cap length', () => {
    const translation = Translation.createNewTranslation({ ...validDto(), text: 'x'.repeat(200) });

    expect(translation.text).toHaveLength(200);
  });

  it('rejects an empty selectionId', () => {
    expect(() =>
      Translation.createNewTranslation({ selectionId: '', languageCode: 'es', text: 'x' }),
    ).toThrow(DomainError);
  });

  it('updates text', () => {
    const translation = Translation.createNewTranslation(validDto());

    translation.updateTranslation({ text: 'Opción A (actualizada)' });

    expect(translation.text).toBe('Opción A (actualizada)');
  });

  it('rejects too long text on update', () => {
    const translation = Translation.createNewTranslation(validDto());

    expect(() => translation.updateTranslation({ text: 'x'.repeat(201) })).toThrow(DomainError);
  });

  it('assigns id only once', () => {
    const translation = Translation.createNewTranslation(validDto());

    translation.assignId('t-1');

    expect(translation.id).toBe('t-1');
    expect(() => translation.assignId('t-2')).toThrow(DomainError);
  });
});

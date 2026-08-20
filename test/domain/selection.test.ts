import { Question } from '@/domain/question';
import { Selection } from '@/domain/selection';
import { DomainError } from '@/domain/domain-error';

function persistedQuestion(type = 'single'): Question {
  const question = Question.createNewQuestion({ key: 'q', type, order: 1 });
  question.assignId('q-1');
  return question;
}

describe('Selection domain', () => {
  it('creates a valid selection for a persisted choice question', () => {
    const selection = Selection.createNewSelection({
      question: persistedQuestion(),
      key: 's_yes',
      order: 1,
    });

    expect(selection.id).toBeNull();
    expect(selection.key).toBe('s_yes');
    expect(selection.order).toBe(1);
    expect(selection.questionId).toBe('q-1');
  });

  it('rejects selections on text questions', () => {
    expect(() =>
      Selection.createNewSelection({ question: persistedQuestion('text'), key: 's', order: 1 }),
    ).toThrow(DomainError);
  });

  it('rejects selections for an unpersisted question', () => {
    const question = Question.createNewQuestion({ key: 'q', type: 'single', order: 1 });

    expect(() => Selection.createNewSelection({ question, key: 's', order: 1 })).toThrow(
      DomainError,
    );
  });

  it('rejects an empty key', () => {
    expect(() =>
      Selection.createNewSelection({ question: persistedQuestion(), key: ' ', order: 1 }),
    ).toThrow(DomainError);
  });

  it.each([-1, 1.5])('rejects invalid order %p', (order) => {
    expect(() =>
      Selection.createNewSelection({ question: persistedQuestion(), key: 's', order }),
    ).toThrow(DomainError);
  });

  it('updates selection fields', () => {
    const selection = Selection.createNewSelection({
      question: persistedQuestion(),
      key: 's',
      order: 1,
    });

    selection.updateSelection({ key: 's2', order: 3 });

    expect(selection.key).toBe('s2');
    expect(selection.order).toBe(3);
  });

  it('assigns id only once', () => {
    const selection = Selection.createNewSelection({
      question: persistedQuestion(),
      key: 's',
      order: 1,
    });

    selection.assignId('sel-1');

    expect(selection.id).toBe('sel-1');
    expect(() => selection.assignId('sel-2')).toThrow(DomainError);
  });
});

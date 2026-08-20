import { Question } from '@/domain/question';
import { DomainError } from '@/domain/domain-error';

describe('Question domain', () => {
  it('creates a valid question', () => {
    const question = Question.createNewQuestion({ key: 'q_intensity', type: 'single', order: 1 });

    expect(question.id).toBeNull();
    expect(question.key).toBe('q_intensity');
    expect(question.type).toBe('single');
    expect(question.order).toBe(1);
    expect(question.isChoiceType()).toBe(true);
  });

  it('creates a text question as non-choice', () => {
    const question = Question.createNewQuestion({ key: 'q_text', type: 'text', order: 2 });

    expect(question.isChoiceType()).toBe(false);
  });

  it.each(['', 'slider', 'radio', 'single-choice'])('rejects invalid type %p', (type) => {
    expect(() => Question.createNewQuestion({ key: 'q', type, order: 1 })).toThrow(DomainError);
  });

  it.each([-1, 1.5, NaN])('rejects invalid order %p', (order) => {
    expect(() => Question.createNewQuestion({ key: 'q', type: 'single', order })).toThrow(
      DomainError,
    );
  });

  it('rejects an empty key', () => {
    expect(() => Question.createNewQuestion({ key: ' ', type: 'single', order: 1 })).toThrow(
      DomainError,
    );
  });

  it('updates question fields', () => {
    const question = Question.createNewQuestion({ key: 'q', type: 'single', order: 1 });

    question.updateQuestion({ key: 'q2', type: 'scale', order: 5 });

    expect(question.key).toBe('q2');
    expect(question.type).toBe('scale');
    expect(question.order).toBe(5);
  });

  it('rejects an invalid update', () => {
    const question = Question.createNewQuestion({ key: 'q', type: 'single', order: 1 });

    expect(() => question.updateQuestion({ type: 'nope' })).toThrow(DomainError);
  });

  it('assigns id only once', () => {
    const question = Question.createNewQuestion({ key: 'q', type: 'single', order: 1 });

    question.assignId('q-1');

    expect(question.id).toBe('q-1');
    expect(() => question.assignId('q-2')).toThrow(DomainError);
  });
});

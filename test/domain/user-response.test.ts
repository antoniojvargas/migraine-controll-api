import { Question } from '@/domain/question';
import { UserResponse } from '@/domain/user-response';
import { DomainError } from '@/domain/domain-error';

function question(type: string): Question {
  const q = Question.createNewQuestion({ key: `q_${type}`, type, order: 1 });
  q.assignId(`q-${type}`);
  return q;
}

describe('UserResponse domain', () => {
  it('creates a choice response with a selection', () => {
    const response = UserResponse.createNewUserResponse({
      userId: 'u-1',
      question: question('single'),
      selectionId: 'sel-1',
    });

    expect(response.id).toBeNull();
    expect(response.userId).toBe('u-1');
    expect(response.selectionId).toBe('sel-1');
    expect(response.answerText).toBeNull();
    expect(response.migraineLogId).toBeNull();
    expect(response.preventiveTreatmentId).toBeNull();
  });

  it('rejects a choice response without a selection', () => {
    expect(() =>
      UserResponse.createNewUserResponse({ userId: 'u-1', question: question('single') }),
    ).toThrow(DomainError);
  });

  it('rejects a choice response with answerText', () => {
    expect(() =>
      UserResponse.createNewUserResponse({
        userId: 'u-1',
        question: question('multiple'),
        selectionId: 'sel-1',
        answerText: 'texto',
      }),
    ).toThrow(DomainError);
  });

  it('creates a text response with answerText', () => {
    const response = UserResponse.createNewUserResponse({
      userId: 'u-1',
      question: question('text'),
      answerText: 'respuesta libre',
    });

    expect(response.answerText).toBe('respuesta libre');
    expect(response.selectionId).toBeNull();
  });

  it('rejects a text response without answerText', () => {
    expect(() =>
      UserResponse.createNewUserResponse({ userId: 'u-1', question: question('text') }),
    ).toThrow(DomainError);
  });

  it('rejects a text response with a selection', () => {
    expect(() =>
      UserResponse.createNewUserResponse({
        userId: 'u-1',
        question: question('text'),
        selectionId: 'sel-1',
      }),
    ).toThrow(DomainError);
  });

  it('rejects answerText longer than the cap', () => {
    expect(() =>
      UserResponse.createNewUserResponse({
        userId: 'u-1',
        question: question('text'),
        answerText: 'x'.repeat(1001),
      }),
    ).toThrow(DomainError);
  });

  it('accepts optional references', () => {
    const response = UserResponse.createNewUserResponse({
      userId: 'u-1',
      question: question('single'),
      selectionId: 'sel-1',
      migraineLogId: 'log-1',
      preventiveTreatmentId: 'tr-1',
    });

    expect(response.migraineLogId).toBe('log-1');
    expect(response.preventiveTreatmentId).toBe('tr-1');
  });

  it('updates a response preserving coherence', () => {
    const response = UserResponse.createNewUserResponse({
      userId: 'u-1',
      question: question('text'),
      answerText: 'a',
    });

    response.updateUserResponse({ answerText: 'b' });

    expect(response.answerText).toBe('b');
  });

  it('rejects an incoherent update and keeps state', () => {
    const response = UserResponse.createNewUserResponse({
      userId: 'u-1',
      question: question('single'),
      selectionId: 'sel-1',
    });

    expect(() => response.updateUserResponse({ answerText: 'texto' })).toThrow(DomainError);
    expect(response.selectionId).toBe('sel-1');
  });

  it('assigns id only once', () => {
    const response = UserResponse.createNewUserResponse({
      userId: 'u-1',
      question: question('single'),
      selectionId: 'sel-1',
    });

    response.assignId('r-1');

    expect(response.id).toBe('r-1');
    expect(() => response.assignId('r-2')).toThrow(DomainError);
  });
});

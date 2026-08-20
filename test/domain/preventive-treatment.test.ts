import { PreventiveTreatment } from '@/domain/preventive-treatment';
import { DomainError } from '@/domain/domain-error';

const tomorrow = () => new Date(Date.now() + 24 * 60 * 60 * 1000);

describe('PreventiveTreatment domain', () => {
  it('creates a non-recurrent treatment', () => {
    const treatment = PreventiveTreatment.createNewPreventiveTreatment({
      userId: 'u-1',
      name: 'Propranolol',
    });

    expect(treatment.id).toBeNull();
    expect(treatment.userId).toBe('u-1');
    expect(treatment.name).toBe('Propranolol');
    expect(treatment.isRecurrent).toBe(false);
    expect(treatment.repeatUntil).toBeNull();
  });

  it('creates a recurrent treatment with repeatUntil', () => {
    const treatment = PreventiveTreatment.createNewPreventiveTreatment({
      userId: 'u-1',
      name: 'Amitriptilina',
      isRecurrent: true,
      repeatUntil: tomorrow(),
    });

    expect(treatment.isRecurrent).toBe(true);
    expect(treatment.repeatUntil).not.toBeNull();
  });

  it('rejects repeatUntil without isRecurrent', () => {
    expect(() =>
      PreventiveTreatment.createNewPreventiveTreatment({
        userId: 'u-1',
        name: 'X',
        repeatUntil: tomorrow(),
      }),
    ).toThrow(DomainError);
  });

  it('rejects a past repeatUntil', () => {
    expect(() =>
      PreventiveTreatment.createNewPreventiveTreatment({
        userId: 'u-1',
        name: 'X',
        isRecurrent: true,
        repeatUntil: new Date('2020-01-01'),
      }),
    ).toThrow(DomainError);
  });

  it('rejects an empty or too long name', () => {
    expect(() =>
      PreventiveTreatment.createNewPreventiveTreatment({ userId: 'u-1', name: '' }),
    ).toThrow(DomainError);
    expect(() =>
      PreventiveTreatment.createNewPreventiveTreatment({ userId: 'u-1', name: 'x'.repeat(101) }),
    ).toThrow(DomainError);
  });

  it('updates a treatment', () => {
    const treatment = PreventiveTreatment.createNewPreventiveTreatment({
      userId: 'u-1',
      name: 'X',
    });

    treatment.updatePreventiveTreatment({ name: 'Y', isRecurrent: true, repeatUntil: tomorrow() });

    expect(treatment.name).toBe('Y');
    expect(treatment.isRecurrent).toBe(true);
    expect(treatment.repeatUntil).not.toBeNull();
  });

  it('rejects an incoherent update', () => {
    const treatment = PreventiveTreatment.createNewPreventiveTreatment({
      userId: 'u-1',
      name: 'X',
    });

    expect(() => treatment.updatePreventiveTreatment({ repeatUntil: tomorrow() })).toThrow(
      DomainError,
    );
    expect(treatment.repeatUntil).toBeNull();
  });

  it('assigns id only once', () => {
    const treatment = PreventiveTreatment.createNewPreventiveTreatment({
      userId: 'u-1',
      name: 'X',
    });

    treatment.assignId('t-1');

    expect(treatment.id).toBe('t-1');
    expect(() => treatment.assignId('t-2')).toThrow(DomainError);
  });
});

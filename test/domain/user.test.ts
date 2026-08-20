import { User } from '@/domain/user';
import { DomainError } from '@/domain/domain-error';

describe('User domain', () => {
  it('creates a valid user and normalizes email/externalId', () => {
    const user = User.createNewUser({ email: '  ANA@Test.COM ', externalId: '  ext-1 ' });

    expect(user.id).toBeNull();
    expect(user.email).toBe('ana@test.com');
    expect(user.externalId).toBe('ext-1');
    expect(user.originalEmail).toBeNull();
  });

  it.each(['', ' ', 'no-es-email', 'a@b', 'a@b@c.com'])('rejects invalid email %p', (email) => {
    expect(() => User.createNewUser({ email, externalId: 'ext-1' })).toThrow(DomainError);
  });

  it('rejects an empty externalId', () => {
    expect(() => User.createNewUser({ email: 'a@test.com', externalId: '' })).toThrow(DomainError);
  });

  it('updates email and originalEmail', () => {
    const user = User.createNewUser({ email: 'a@test.com', externalId: 'ext-1' });

    user.updateUser({ email: 'b@test.com', originalEmail: 'a@test.com' });

    expect(user.email).toBe('b@test.com');
    expect(user.originalEmail).toBe('a@test.com');
  });

  it('clears originalEmail with null', () => {
    const user = User.createNewUser({ email: 'a@test.com', externalId: 'ext-1' });

    user.updateUser({ originalEmail: 'a@test.com' });
    user.updateUser({ originalEmail: null });

    expect(user.originalEmail).toBeNull();
  });

  it('rejects an invalid email on update and keeps state', () => {
    const user = User.createNewUser({ email: 'a@test.com', externalId: 'ext-1' });

    expect(() => user.updateUser({ email: 'malo' })).toThrow(DomainError);
    expect(user.email).toBe('a@test.com');
  });

  it('assigns id only once', () => {
    const user = User.createNewUser({ email: 'a@test.com', externalId: 'ext-1' });

    user.assignId('u-1');

    expect(user.id).toBe('u-1');
    expect(() => user.assignId('u-2')).toThrow(DomainError);
  });
});

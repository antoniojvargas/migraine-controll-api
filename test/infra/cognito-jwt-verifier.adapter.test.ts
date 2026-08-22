import { CognitoJwtVerifier } from 'aws-jwt-verify';
import { CognitoJwtVerifierAdapter } from '@/infra/aws/cognito-jwt-verifier.adapter';

jest.mock('aws-jwt-verify', () => ({
  CognitoJwtVerifier: { create: jest.fn() },
}));

describe('CognitoJwtVerifierAdapter', () => {
  const createMock = CognitoJwtVerifier.create as jest.Mock;

  afterEach(() => {
    createMock.mockReset();
  });

  it('verifies against the current pool and returns the sub claim', async () => {
    const verify = jest.fn().mockResolvedValue({ sub: 'sub-1' });
    createMock.mockReturnValue({ verify });

    const adapter = new CognitoJwtVerifierAdapter('pool-1');
    const result = await adapter.verify('token');

    expect(createMock).toHaveBeenCalledWith({
      userPoolId: 'pool-1',
      tokenUse: 'access',
      clientId: null,
    });
    expect(verify).toHaveBeenCalledWith('token');
    expect(result).toEqual({ sub: 'sub-1' });
  });

  it('falls back to the legacy pool when verification fails against the current pool', async () => {
    const currentVerify = jest.fn().mockRejectedValue(new Error('invalid token'));
    const legacyVerify = jest.fn().mockResolvedValue({ sub: 'sub-legacy' });
    createMock
      .mockReturnValueOnce({ verify: currentVerify })
      .mockReturnValueOnce({ verify: legacyVerify });

    const adapter = new CognitoJwtVerifierAdapter('pool-1', 'legacy-pool');
    const result = await adapter.verify('token');

    expect(legacyVerify).toHaveBeenCalledWith('token');
    expect(result).toEqual({ sub: 'sub-legacy' });
  });

  it('rejects when verification fails and there is no legacy pool', async () => {
    const verify = jest.fn().mockRejectedValue(new Error('invalid token'));
    createMock.mockReturnValue({ verify });

    const adapter = new CognitoJwtVerifierAdapter('pool-1');

    await expect(adapter.verify('token')).rejects.toThrow('invalid token');
  });

  it('rejects when both pools fail verification', async () => {
    const currentVerify = jest.fn().mockRejectedValue(new Error('invalid token'));
    const legacyVerify = jest.fn().mockRejectedValue(new Error('invalid legacy token'));
    createMock
      .mockReturnValueOnce({ verify: currentVerify })
      .mockReturnValueOnce({ verify: legacyVerify });

    const adapter = new CognitoJwtVerifierAdapter('pool-1', 'legacy-pool');

    await expect(adapter.verify('token')).rejects.toThrow('invalid legacy token');
  });
});

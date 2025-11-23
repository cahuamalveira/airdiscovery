/**
 * Mock implementation of jose library for E2E tests
 * 
 * Since we use MockAuthMiddleware in tests, we don't need real JWT verification.
 * This mock prevents ESM module resolution issues with Jest.
 */

export const jwtVerify = jest.fn().mockResolvedValue({
  payload: {
    sub: 'test-user-123',
    email: 'test@example.com',
    email_verified: true,
    username: 'testuser',
    'cognito:username': 'testuser',
    'cognito:groups': ['users'],
    token_use: 'access',
    aud: 'test-client-id',
    iss: 'https://cognito-idp.us-east-1.amazonaws.com/test-pool',
    exp: Math.floor(Date.now() / 1000) + 3600,
    iat: Math.floor(Date.now() / 1000),
    client_id: 'test-client-id',
  },
  protectedHeader: {},
});

export const createRemoteJWKSet = jest.fn().mockReturnValue(jest.fn());

export const decodeJwt = jest.fn().mockImplementation((token: string) => {
  return {
    sub: 'test-user-123',
    email: 'test@example.com',
    email_verified: true,
    username: 'testuser',
    'cognito:username': 'testuser',
    'cognito:groups': ['users'],
    token_use: 'access',
    aud: 'test-client-id',
    iss: 'https://cognito-idp.us-east-1.amazonaws.com/test-pool',
    exp: Math.floor(Date.now() / 1000) + 3600,
    iat: Math.floor(Date.now() / 1000),
    client_id: 'test-client-id',
  };
});

export const SignJWT = jest.fn().mockImplementation(() => ({
  setProtectedHeader: jest.fn().mockReturnThis(),
  setIssuedAt: jest.fn().mockReturnThis(),
  setIssuer: jest.fn().mockReturnThis(),
  setAudience: jest.fn().mockReturnThis(),
  setExpirationTime: jest.fn().mockReturnThis(),
  sign: jest.fn().mockResolvedValue('mock-jwt-token'),
}));

export const generateKeyPair = jest.fn().mockResolvedValue({
  publicKey: 'mock-public-key',
  privateKey: 'mock-private-key',
});

export const exportJWK = jest.fn().mockResolvedValue({
  kty: 'RSA',
  n: 'mock-n',
  e: 'AQAB',
});

export const importJWK = jest.fn().mockResolvedValue('mock-key');

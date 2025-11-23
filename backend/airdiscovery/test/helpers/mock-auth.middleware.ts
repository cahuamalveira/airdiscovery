import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

/**
 * Mock Authentication Middleware for E2E Testing
 * 
 * This middleware bypasses real Cognito authentication and injects
 * a test user into the request object for integration testing.
 */
@Injectable()
export class MockAuthMiddleware implements NestMiddleware {
  use(req: any, res: Response, next: NextFunction) {
    // Check if Authorization header is present
    const authHeader = req.headers.authorization;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      // Extract token (in tests, this will be a simple identifier)
      const token = authHeader.substring(7);
      
      // Mock user data based on token
      // In real tests, you can customize this per test case
      req.user = {
        sub: 'test-user-123',
        email: 'test@example.com',
        email_verified: true,
        username: 'testuser',
        given_name: 'Test',
        family_name: 'User',
        'cognito:groups': ['users'],
        'cognito:username': 'testuser',
        aud: 'test-client-id',
        iss: 'https://cognito-idp.us-east-1.amazonaws.com/test-pool',
        token_use: 'access',
        exp: Math.floor(Date.now() / 1000) + 3600, // 1 hour from now
        iat: Math.floor(Date.now() / 1000),
        client_id: 'test-client-id',
      };
      
      req.accessToken = token;
    }
    
    next();
  }
}

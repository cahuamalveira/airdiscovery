# AWS Amplify Authentication Middleware

This authentication middleware integrates with AWS Cognito tokens from your React SPA using AWS Amplify.

## Features

- **JWT Token Verification**: Validates tokens using AWS Cognito's JWKS endpoint
- **User Information Extraction**: Extracts user details from token claims and Cognito API
- **Role-Based Access Control**: Support for custom roles and Cognito groups
- **Decorators**: Easy-to-use decorators for accessing user data
- **Guards**: Protect routes with role/group requirements
- **Type Safety**: Full TypeScript support with proper types

## Installation

Required dependencies are already installed:
```bash
npm install @aws-sdk/client-cognito-identity-provider @aws-sdk/credential-providers jsonwebtoken jose @types/jsonwebtoken
```

## Environment Configuration

Create a `.env` file with the following variables:

```env
# AWS Cognito Configuration (Required)
AWS_REGION=us-east-2
USER_POOL_ID=your-user-pool-id
USER_POOL_CLIENT_ID=your-user-pool-client-id

# Optional: AWS Credentials (if not using IAM roles)
# AWS_ACCESS_KEY_ID=your-access-key
# AWS_SECRET_ACCESS_KEY=your-secret-key
```

## How It Works

### 1. Token Validation Flow

1. Extracts JWT token from `Authorization: Bearer <token>` header
2. Verifies token signature using AWS Cognito JWKS
3. Validates token claims (issuer, audience, expiration)
4. Optionally fetches additional user info from Cognito
5. Attaches user data to request object

### 2. Middleware Configuration

The middleware is globally applied to all routes except excluded ones:

```typescript
// app.module.ts
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(AuthMiddleware)
      .exclude(
        'health',
        'auth/public/(.*)',
        '(.*)/health',
        'docs/(.*)',
        // Add any other public routes here
      )
      .forRoutes('*');
  }
}
```

## Usage Examples

### 1. Basic Controller with Authentication

```typescript
import { Controller, Get } from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/auth.decorators';
import { AuthenticatedRequest } from '../../common/middlewares/auth.middleware';

@Controller('profile')
export class ProfileController {
  @Get()
  getProfile(@CurrentUser() user: AuthenticatedRequest['user']) {
    return {
      id: user.sub,
      username: user.username,
      email: user.email,
      emailVerified: user.email_verified,
    };
  }
}
```

### 2. Role-Based Protection

```typescript
import { Controller, Get, UseGuards } from '@nestjs/common';
import { RolesGuard, Roles } from '../../common/guards/roles.guard';
import { CurrentUser } from '../../common/decorators/auth.decorators';

@Controller('admin')
export class AdminController {
  @Get()
  @UseGuards(RolesGuard)
  @Roles('admin', 'moderator')
  getAdminData(@CurrentUser() user: AuthenticatedRequest['user']) {
    return { message: 'Admin data', user: user.username };
  }
}
```

### 3. Group-Based Protection

```typescript
import { Controller, Get, UseGuards } from '@nestjs/common';
import { RolesGuard, RequireGroups } from '../../common/guards/roles.guard';

@Controller('premium')
export class PremiumController {
  @Get()
  @UseGuards(RolesGuard)
  @RequireGroups('Premium', 'VIP')
  getPremiumContent(@CurrentUser() user: AuthenticatedRequest['user']) {
    return { message: 'Premium content', groups: user['cognito:groups'] };
  }
}
```

### 4. Accessing Token and User Data

```typescript
import { Controller, Post } from '@nestjs/common';
import { CurrentUser, AccessToken } from '../../common/decorators/auth.decorators';

@Controller('secure')
export class SecureController {
  @Post('validate')
  validateToken(
    @CurrentUser() user: AuthenticatedRequest['user'],
    @AccessToken() token: string
  ) {
    return {
      user: { id: user.sub, username: user.username },
      tokenValid: true,
      expiresAt: new Date(user.exp * 1000),
    };
  }
}
```

## Available User Properties

The `user` object contains the following properties:

```typescript
interface User {
  sub: string;                    // User ID
  email: string;                  // Email address
  email_verified: boolean;        // Email verification status
  username: string;               // Username
  given_name?: string;           // First name
  family_name?: string;          // Last name
  picture?: string;              // Profile picture URL
  'cognito:groups'?: string[];   // Cognito groups
  'cognito:username': string;    // Cognito username
  'custom:role'?: string;        // Custom role attribute
  aud: string;                   // Token audience
  iss: string;                   // Token issuer
  token_use: string;             // Token type (access)
  exp: number;                   // Expiration timestamp
  iat: number;                   // Issued at timestamp
}
```

## Frontend Integration

Your React app should send tokens in the Authorization header:

```typescript
// In your React app (with AWS Amplify)
import { fetchAuthSession } from '@aws-amplify/auth';

const makeAuthenticatedRequest = async () => {
  try {
    const session = await fetchAuthSession();
    const token = session.tokens?.accessToken?.toString();
    
    const response = await fetch('/api/protected-endpoint', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    
    return response.json();
  } catch (error) {
    console.error('Request failed:', error);
  }
};
```

## Error Handling

The middleware throws the following exceptions:

- `UnauthorizedException`: Missing token, invalid token, or expired token
- `ForbiddenException`: Valid token but insufficient permissions (from guards)

## Security Considerations

1. **Token Validation**: All tokens are verified against AWS Cognito's JWKS
2. **HTTPS Only**: Use HTTPS in production to protect tokens in transit
3. **Environment Variables**: Keep AWS credentials and pool IDs in environment variables
4. **Token Expiration**: Tokens are automatically validated for expiration
5. **IAM Roles**: Use IAM roles instead of access keys when possible

## Testing

Example test for protected endpoints:

```typescript
// In your test files
import { Test } from '@nestjs/testing';
import { AuthController } from './auth.controller';

describe('AuthController', () => {
  let controller: AuthController;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      controllers: [AuthController],
    }).compile();

    controller = module.get<AuthController>(AuthController);
  });

  it('should return user profile', () => {
    const mockUser = {
      sub: 'user-123',
      username: 'testuser',
      email: 'test@example.com',
      email_verified: true,
    };

    const result = controller.getProfile(mockUser as any);
    expect(result.user.username).toBe('testuser');
  });
});
```

## Troubleshooting

### Common Issues

1. **"USER_POOL_ID environment variable is required"**
   - Ensure you have set the `USER_POOL_ID` in your `.env` file

2. **"Token verification failed"**
   - Check that the token is valid and not expired
   - Verify that `USER_POOL_CLIENT_ID` matches your Cognito app client

3. **"Invalid authorization header format"**
   - Ensure the frontend sends tokens as `Bearer <token>`

4. **"Access denied" errors**
   - Check user roles/groups in Cognito
   - Verify the required roles/groups in your guards

### Debug Mode

Enable debug logging by setting the log level:

```typescript
// In main.ts
import { Logger } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log', 'debug', 'verbose'],
  });
  
  // ... rest of bootstrap
}
```

## Production Deployment

1. Set environment variables in your deployment platform
2. Use IAM roles for AWS credentials when possible
3. Enable HTTPS/TLS
4. Consider using AWS ALB for additional security
5. Monitor authentication logs for suspicious activity

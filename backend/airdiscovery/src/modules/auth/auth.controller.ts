import { 
  Controller, 
  Get, 
  Post, 
  Body, 
  UseGuards,
  Logger 
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { CurrentUser, AccessToken } from '../../common/decorators/auth.decorators';
import { RolesGuard, Roles, RequireGroups } from '../../common/guards/roles.guard';
import { AuthenticatedRequest } from '../../common/middlewares/auth.middleware';

@Controller('auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(private readonly authService: AuthService) {}

  @Get('profile')
  getProfile(@CurrentUser() user: AuthenticatedRequest['user']) {
    this.logger.log(`Profile requested by user: ${user?.username}`);
    return {
      message: 'Profile retrieved successfully',
      user: {
        id: user?.sub,
        username: user?.username,
        email: user?.email,
        emailVerified: user?.email_verified,
        givenName: user?.given_name,
        familyName: user?.family_name,
        picture: user?.picture,
        groups: user?.['cognito:groups'],
        role: user?.['custom:role'],
      },
    };
  }

  @Get('protected')
  @UseGuards(RolesGuard)
  @Roles('admin', 'moderator')
  getProtectedResource(@CurrentUser() user: AuthenticatedRequest['user']) {
    return {
      message: 'Access granted to protected resource',
      user: user?.username,
      role: user?.['custom:role'],
    };
  }

  @Get('admin-only')
  @UseGuards(RolesGuard)
  @RequireGroups('Administrators')
  getAdminOnlyResource(@CurrentUser() user: AuthenticatedRequest['user']) {
    return {
      message: 'Admin-only resource accessed',
      user: user?.username,
      groups: user?.['cognito:groups'],
    };
  }

  @Post('validate-token')
  validateToken(
    @CurrentUser() user: AuthenticatedRequest['user'],
    @AccessToken() token: string
  ) {
    return {
      message: 'Token is valid',
      user: {
        sub: user?.sub,
        username: user?.username,
        email: user?.email,
      },
      tokenInfo: {
        issuer: user?.iss,
        audience: user?.aud,
        expiresAt: user?.exp ? new Date(user.exp * 1000) : null,
        issuedAt: user?.iat ? new Date(user.iat * 1000) : null,
      },
    };
  }

  @Get('user-attributes')
  getUserAttributes(@CurrentUser() user: AuthenticatedRequest['user']) {
    return {
      message: 'User attributes retrieved',
      attributes: user,
    };
  }

  @Post('debug-token')
  debugToken(@Body('token') token: string) {
    const debugInfo = {
      tokenPresent: !!token,
      tokenFormat: 'unknown',
      tokenParts: 0,
      headerFormat: 'unknown',
      userPoolId: process.env.USER_POOL_ID || 'not_set',
      region: process.env.AWS_REGION || 'not_set',
      expectedIssuer: `https://cognito-idp.${process.env.AWS_REGION || 'unknown'}.amazonaws.com/${process.env.USER_POOL_ID || 'unknown'}`,
      expectedAudience: process.env.USER_POOL_CLIENT_ID || 'not_set',
      decodedHeader: null as any,
      decodedPayload: null as any,
      error: null as string | null,
      tokenType: 'unknown',
      hasAudClaim: false,
      hasClientIdClaim: false,
    };

    if (!token) {
      debugInfo.error = 'No token provided';
      return debugInfo;
    }

    // Check token format
    const tokenParts = token.split('.');
    debugInfo.tokenParts = tokenParts.length;
    
    if (tokenParts.length === 3) {
      debugInfo.tokenFormat = 'JWT (3 parts)';
      
      try {
        // Decode header
        const headerDecoded = Buffer.from(
          tokenParts[0].replace(/-/g, '+').replace(/_/g, '/'), 
          'base64'
        ).toString();
        debugInfo.decodedHeader = JSON.parse(headerDecoded);
        
        // Decode payload (but pad if needed)
        let payload = tokenParts[1];
        while (payload.length % 4) {
          payload += '=';
        }
        const payloadDecoded = Buffer.from(
          payload.replace(/-/g, '+').replace(/_/g, '/'), 
          'base64'
        ).toString();
        const payloadObj = JSON.parse(payloadDecoded);
        debugInfo.decodedPayload = payloadObj;
        
        // Analyze token type and claims
        debugInfo.tokenType = payloadObj.token_use || 'unknown';
        debugInfo.hasAudClaim = !!payloadObj.aud;
        debugInfo.hasClientIdClaim = !!payloadObj.client_id;
        
        // Additional info for troubleshooting
        if (debugInfo.tokenType === 'access' && !debugInfo.hasAudClaim) {
          debugInfo.error = 'Access token missing aud claim - this is normal for AWS Cognito access tokens';
        }
        
      } catch (error) {
        debugInfo.error = `Failed to decode JWT: ${error.message}`;
      }
    } else {
      debugInfo.tokenFormat = `Invalid JWT (${tokenParts.length} parts)`;
      debugInfo.error = 'JWT must have exactly 3 parts separated by dots';
    }

    return debugInfo;
  }

  @Get('health')
  healthCheck() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      environment: {
        userPoolId: process.env.USER_POOL_ID ? 'set' : 'not_set',
        userPoolClientId: process.env.USER_POOL_CLIENT_ID ? 'set' : 'not_set',
        awsRegion: process.env.AWS_REGION || 'not_set',
        awsAccessKeyId: process.env.AWS_ACCESS_KEY_ID ? 'set' : 'not_set',
      }
    };
  }
}

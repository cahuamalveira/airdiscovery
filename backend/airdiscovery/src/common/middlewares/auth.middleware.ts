import {
  Injectable,
  NestMiddleware,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { CognitoIdentityProviderClient, GetUserCommand } from '@aws-sdk/client-cognito-identity-provider';
import { jwtVerify, createRemoteJWKSet, decodeJwt } from 'jose';

export interface AuthenticatedRequest extends Request {
  user?: {
    sub: string;
    email: string;
    email_verified: boolean;
    username: string;
    given_name?: string;
    family_name?: string;
    picture?: string;
    'cognito:groups'?: string[];
    'cognito:username': string;
    'custom:role'?: string;
    aud: string;
    iss: string;
    token_use: string;
    exp: number;
    iat: number;
    client_id?: string; // Access tokens may have client_id instead of aud
  };
  accessToken?: string;
}

@Injectable()
export class AuthMiddleware implements NestMiddleware {
  private readonly logger = new Logger(AuthMiddleware.name);
  private readonly cognitoClient: CognitoIdentityProviderClient;
  private readonly region: string;
  private readonly userPoolId: string;
  private readonly jwksUri: string;
  private jwks: ReturnType<typeof createRemoteJWKSet>;

  constructor() {
    this.region = process.env.AWS_REGION || 'us-east-2';
    this.userPoolId = process.env.USER_POOL_ID || '';
    
    if (!this.userPoolId) {
      throw new Error('USER_POOL_ID environment variable is required');
    }

    this.jwksUri = `https://cognito-idp.${this.region}.amazonaws.com/${this.userPoolId}/.well-known/jwks.json`;
    this.jwks = createRemoteJWKSet(new URL(this.jwksUri));

    this.cognitoClient = new CognitoIdentityProviderClient({
      region: this.region,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
      },
    });
  }

  async use(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const token = this.extractTokenFromHeader(req);
      
      if (!token) {
        this.logger.warn('No access token provided in request');
        throw new UnauthorizedException('Access token is required');
      }

      // Log token format for debugging (first 20 chars only)
      this.logger.debug(`Token format check: ${token.substring(0, 20)}...`);

      // Verify and decode the JWT token
      const payload = await this.verifyToken(token);
      
      // Validate token type and audience
      this.validateTokenClaims(payload);

      // Optionally get additional user info from Cognito
      const userInfo = await this.getUserInfo(token);

      // Attach user information to request
      req.user = {
        sub: payload.sub as string,
        email: payload.email as string,
        email_verified: payload.email_verified as boolean,
        // Access tokens may use 'username' instead of 'cognito:username'
        username: payload['cognito:username'] || payload.username as string,
        given_name: payload.given_name as string,
        family_name: payload.family_name as string,
        picture: payload.picture as string,
        'cognito:groups': payload['cognito:groups'] as string[],
        'cognito:username': payload['cognito:username'] || payload.username as string,
        'custom:role': payload['custom:role'] as string,
        // Access tokens may not have 'aud' claim, could have 'client_id' instead
        aud: payload.aud || payload.client_id as string,
        iss: payload.iss as string,
        token_use: payload.token_use as string,
        exp: payload.exp as number,
        iat: payload.iat as number,
        client_id: payload.client_id as string,
        ...userInfo,
      };

      req.accessToken = token;

      this.logger.log(`User authenticated: ${req.user?.username} (${req.user?.sub})`);
      next();
    } catch (error) {
      this.logger.error('Authentication failed:', error.message);
      this.handleAuthenticationError(error, res);
    }
  }

  private handleAuthenticationError(error: any, res: Response): void {
    if (error instanceof UnauthorizedException) {
      res.status(401).json({
        statusCode: 401,
        message: error.message,
        error: 'Unauthorized',
        timestamp: new Date().toISOString(),
      });
    } else {
      res.status(401).json({
        statusCode: 401,
        message: 'Authentication failed',
        error: 'Unauthorized',
        timestamp: new Date().toISOString(),
      });
    }
  }

  private extractTokenFromHeader(req: Request): string | null {
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      this.logger.debug('No authorization header found');
      return null;
    }

    this.logger.debug(`Auth header: ${authHeader.substring(0, 30)}...`);

    const [type, token] = authHeader.split(' ');
    
    if (type !== 'Bearer') {
      this.logger.warn(`Invalid authorization type: ${type}. Expected 'Bearer'`);
      throw new UnauthorizedException('Invalid authorization header format. Expected Bearer token');
    }

    if (!token) {
      this.logger.warn('Bearer token is empty');
      throw new UnauthorizedException('Bearer token is missing');
    }

    // Basic JWT format validation using decodeJwt (more efficient than manual parsing)
    try {
      decodeJwt(token);
      this.logger.debug('Token format validation passed');
    } catch (error) {
      this.logger.warn(`Invalid JWT token format: ${error.message}`);
      throw new UnauthorizedException('Invalid JWT token format');
    }

    return token;
  }

  private async verifyToken(token: string): Promise<any> {
    try {
      let decodedPayload;
      try {
        decodedPayload = decodeJwt(token);
        this.logger.debug(`Token decoded successfully. Token use: ${decodedPayload.token_use}, Has aud: ${!!decodedPayload.aud}, Has client_id: ${!!decodedPayload.client_id}`);
      } catch (error) {
        this.logger.error(`Failed to decode token: ${error.message}`);
        throw new UnauthorizedException('Invalid JWT token format');
      }

      // Determine verification options based on token type and claims
      const verificationOptions: any = {
        issuer: `https://cognito-idp.${this.region}.amazonaws.com/${this.userPoolId}`,
      };

      // Only validate audience if token has 'aud' claim (typically ID tokens)
      // Access tokens usually have 'client_id' instead of 'aud'
      if (decodedPayload.aud && process.env.USER_POOL_CLIENT_ID) {
        verificationOptions.audience = process.env.USER_POOL_CLIENT_ID;
      } else {
      }

      // Perform single JWT verification with appropriate options
      const { payload } = await jwtVerify(token, this.jwks, verificationOptions);

      return payload;
    } catch (error) {
      // Provide more specific error messages
      if (error.message.includes('Invalid Compact JWS')) {
        throw new UnauthorizedException('Invalid JWT token format - malformed token');
      } else if (error.message.includes('signature verification failed')) {
        throw new UnauthorizedException('Token signature verification failed');
      } else if (error.message.includes('expired')) {
        throw new UnauthorizedException('Token has expired');
      } else if (error.message.includes('audience')) {
        throw new UnauthorizedException('Token audience mismatch');
      } else if (error.message.includes('issuer')) {
        throw new UnauthorizedException('Token issuer mismatch');
      }
      
      throw new UnauthorizedException(`Token verification failed: ${error.message}`);
    }
  }

  private validateTokenClaims(payload: any): void {
    this.logger.debug(`Validating token claims. Token use: ${payload.token_use}, Audience: ${payload.aud || payload.client_id || 'none'}, Client ID: ${payload.client_id || 'none'}`);

    // Ensure it's an access token
    if (payload.token_use !== 'access') {
      this.logger.warn(`Invalid token type: ${payload.token_use}. Expected 'access'`);
      throw new UnauthorizedException('Invalid token type. Expected access token');
    }

    // Check if token is expired
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp <= now) {
      const expiredDate = new Date(payload.exp * 1000);
      this.logger.warn(`Token expired at: ${expiredDate.toISOString()}`);
      throw new UnauthorizedException('Token has expired');
    }

    // Validate required claims
    if (!payload.sub) {
      this.logger.warn('Token missing sub claim');
      throw new UnauthorizedException('Token missing required sub claim');
    }

    // For access tokens, cognito:username might not be present, but username should be
    if (!payload['cognito:username'] && !payload.username) {
      this.logger.warn('Token missing cognito:username and username claims');
      throw new UnauthorizedException('Token missing required username claim');
    }

    // Validate client_id if present (common in access tokens)
    if (payload.client_id && process.env.USER_POOL_CLIENT_ID) {
      if (payload.client_id !== process.env.USER_POOL_CLIENT_ID) {
        this.logger.warn(`Client ID mismatch. Expected: ${process.env.USER_POOL_CLIENT_ID}, Got: ${payload.client_id}`);
        throw new UnauthorizedException('Token client ID mismatch');
      }
    }

    // Validate audience if present (common in ID tokens)
    if (payload.aud && process.env.USER_POOL_CLIENT_ID) {
      if (payload.aud !== process.env.USER_POOL_CLIENT_ID) {
        this.logger.warn(`Audience mismatch. Expected: ${process.env.USER_POOL_CLIENT_ID}, Got: ${payload.aud}`);
        throw new UnauthorizedException('Token audience mismatch');
      }
    }

    // Check if token is not yet valid (nbf claim)
    if (payload.nbf && payload.nbf > now) {
      const notBeforeDate = new Date(payload.nbf * 1000);
      this.logger.warn(`Token not valid before: ${notBeforeDate.toISOString()}`);
      throw new UnauthorizedException('Token is not yet valid');
    }

    this.logger.debug('Token claims validation passed');
  }

  private async getUserInfo(accessToken: string): Promise<Partial<any>> {
    try {
      const command = new GetUserCommand({
        AccessToken: accessToken,
      });

      const response = await this.cognitoClient.send(command);
      
      // Convert UserAttributes array to object
      const userAttributes: Record<string, string> = {};
      if (response.UserAttributes) {
        response.UserAttributes.forEach(attr => {
          if (attr.Name && attr.Value) {
            userAttributes[attr.Name] = attr.Value;
          }
        });
      }

      return {
        username: response.Username,
        mfaOptions: response.MFAOptions,
        preferredMfaSetting: response.PreferredMfaSetting,
        userMFASettingList: response.UserMFASettingList,
        attributes: userAttributes,
      };
    } catch (error) {
      this.logger.warn('Failed to get additional user info:', error.message);
      // Don't fail the authentication if we can't get additional info
      return {};
    }
  }
}

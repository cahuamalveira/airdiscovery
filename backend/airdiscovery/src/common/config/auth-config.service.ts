import { Injectable } from '@nestjs/common';

@Injectable()
export class AuthConfigService {
  get awsRegion(): string {
    return process.env.AWS_REGION || 'us-east-2';
  }

  get userPoolId(): string {
    const poolId = process.env.USER_POOL_ID;
    if (!poolId) {
      throw new Error('USER_POOL_ID environment variable is required');
    }
    return poolId;
  }

  get userPoolClientId(): string {
    const clientId = process.env.USER_POOL_CLIENT_ID;
    if (!clientId) {
      throw new Error('USER_POOL_CLIENT_ID environment variable is required');
    }
    return clientId;
  }

  get jwksUri(): string {
    return `https://cognito-idp.${this.awsRegion}.amazonaws.com/${this.userPoolId}/.well-known/jwks.json`;
  }

  get issuer(): string {
    return `https://cognito-idp.${this.awsRegion}.amazonaws.com/${this.userPoolId}`;
  }

  validateConfig(): void {
    this.userPoolId;
    this.userPoolClientId;
  }
}

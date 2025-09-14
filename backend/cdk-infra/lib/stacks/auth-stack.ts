import * as cdk from 'aws-cdk-lib';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import { Construct } from 'constructs';

export interface AuthProps extends cdk.StackProps {
  callbackUrls?: string[];
  logoutUrls?: string[];
}

export class AuthStack extends cdk.Stack {
  public readonly userPool: cognito.UserPool;
  public readonly userPoolClient: cognito.UserPoolClient;
  public readonly identityPool: cognito.CfnIdentityPool;
  public readonly usersGroup: cognito.CfnUserPoolGroup;
  public readonly adminsGroup: cognito.CfnUserPoolGroup;

  constructor(scope: Construct, id: string, props?: AuthProps) {
    super(scope, id, props);

    // AWS Cognito User Pool Configuration
    this.userPool = new cognito.UserPool(this, 'AirDiscoveryUserPool', {
      userPoolName: 'air-discovery-user-pool',
      selfSignUpEnabled: true,
      signInAliases: {
        email: true,
      },
      autoVerify: {
        email: true,
      },
      standardAttributes: {
        email: {
          required: true,
          mutable: true,
        },
        givenName: {
          required: true,
          mutable: true,
        },
      },
      customAttributes: {
        'isAdmin': new cognito.BooleanAttribute({ mutable: true }),
      },
      passwordPolicy: {
        minLength: 8,
        requireLowercase: true,
        requireUppercase: true,
        requireDigits: true,
        requireSymbols: true,
      },
      accountRecovery: cognito.AccountRecovery.EMAIL_ONLY,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // User Pool Client
    this.userPoolClient = new cognito.UserPoolClient(this, 'AirDiscoveryUserPoolClient', {
      userPool: this.userPool,
      userPoolClientName: 'air-discovery-client',
      generateSecret: false,
      authFlows: {
        userSrp: true,
        userPassword: true,
        custom: false,
      },
      oAuth: {
        flows: {
          authorizationCodeGrant: true,
        },
        scopes: [
          cognito.OAuthScope.EMAIL,
          cognito.OAuthScope.OPENID,
          cognito.OAuthScope.PROFILE,
        ],
        callbackUrls: props?.callbackUrls ?? [
          'http://localhost:3000/',
          'https://localhost:3000/',
        ],
        logoutUrls: props?.logoutUrls ?? [
          'http://localhost:3000/',
          'https://localhost:3000/',
        ],
      },
      preventUserExistenceErrors: true,
      refreshTokenValidity: cdk.Duration.days(30),
      accessTokenValidity: cdk.Duration.hours(1),
      idTokenValidity: cdk.Duration.hours(1),
    });

    // Identity Pool for authenticated users
    this.identityPool = new cognito.CfnIdentityPool(this, 'AirDiscoveryIdentityPool', {
      identityPoolName: 'air-discovery-identity-pool',
      allowUnauthenticatedIdentities: false,
      cognitoIdentityProviders: [{
        clientId: this.userPoolClient.userPoolClientId,
        providerName: this.userPool.userPoolProviderName,
      }],
    });

    // User Groups
    this.usersGroup = new cognito.CfnUserPoolGroup(this, 'UsersGroup', {
      userPoolId: this.userPool.userPoolId,
      groupName: 'users',
      description: 'Regular users group',
      precedence: 1,
    });

    this.adminsGroup = new cognito.CfnUserPoolGroup(this, 'AdminsGroup', {
      userPoolId: this.userPool.userPoolId,
      groupName: 'admins',
      description: 'Administrators group',
      precedence: 0,
    });

    // Outputs
    new cdk.CfnOutput(this, 'UserPoolId', {
      value: this.userPool.userPoolId,
      description: 'Cognito User Pool ID',
      exportName: 'AirDiscoveryUserPoolId',
    });

    new cdk.CfnOutput(this, 'UserPoolClientId', {
      value: this.userPoolClient.userPoolClientId,
      description: 'Cognito User Pool Client ID',
      exportName: 'AirDiscoveryUserPoolClientId',
    });

    new cdk.CfnOutput(this, 'IdentityPoolId', {
      value: this.identityPool.ref,
      description: 'Cognito Identity Pool ID',
      exportName: 'AirDiscoveryIdentityPoolId',
    });

    new cdk.CfnOutput(this, 'UserPoolArn', {
      value: this.userPool.userPoolArn,
      description: 'Cognito User Pool ARN',
      exportName: 'AirDiscoveryUserPoolArn',
    });

    new cdk.CfnOutput(this, 'Region', {
      value: this.region,
      description: 'AWS Region',
      exportName: 'AirDiscoveryRegion',
    });
  }
}

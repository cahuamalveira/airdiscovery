#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { SharedVpcStack } from '../lib/shared/vpc';
import { FrontendSpaStack } from '../lib/stacks/frontend-spa-stack';
import { AuthStack } from '../lib/stacks/auth-stack';
import { DatabaseStack } from '../lib/stacks/database-stack';
import { CacheStack } from '../lib/stacks/cache-stack';
import { BedrockStack } from '../lib/stacks/bedrock-stack';

const app = new cdk.App();

// Environment configuration
const env = { 
  account: '855455101180', 
  region: 'us-east-2' 
};

// 1. Shared VPC (base infrastructure)
const vpcStack = new SharedVpcStack(app, 'AirDiscoveryVpcStack', {
  env,
  maxAzs: 2,
});

// 2. Auth Module (Cognito)
const authStack = new AuthStack(app, 'AirDiscoveryAuthStack', {
  env,
  callbackUrls: [
    'http://localhost:3000/',
    'https://localhost:3000/',
    // Add production URLs when available
  ],
  logoutUrls: [
    'http://localhost:3000/',
    'https://localhost:3000/',
    // Add production URLs when available
  ],
});

// 3. Frontend SPA Module (S3 + CloudFront)
const frontendStack = new FrontendSpaStack(app, 'AirDiscoveryFrontendStack', {
  env,
  buildPath: '../../app/build', // Adjust path as needed
});


// 4. Database Module (RDS + DynamoDB)
const databaseStack = new DatabaseStack(app, 'AirDiscoveryDatabaseStack', {
  env,
  vpc: vpcStack.vpc,
});

// 5. Cache Module (Redis/ElastiCache)
const cacheStack = new CacheStack(app, 'AirDiscoveryCacheStack', {
  env,
  vpc: vpcStack.vpc,
});

// 6. Bedrock Module (Amazon Nova Premier v1:0)
const bedrockStack = new BedrockStack(app, 'AirDiscoveryBedrockStack', {
  env,
});

// Dependencies
authStack.addDependency(vpcStack);
frontendStack.addDependency(vpcStack);
frontendStack.addDependency(authStack);
databaseStack.addDependency(vpcStack);
cacheStack.addDependency(vpcStack);
// bedrockStack não tem dependências - pode ser deployado independentemente

app.synth();
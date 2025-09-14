import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import { Construct } from 'constructs';

export interface DatabaseProps extends cdk.StackProps {
  vpc: ec2.Vpc;
  instanceType?: ec2.InstanceType;
  allocatedStorage?: number;
}

export class DatabaseStack extends cdk.Stack {
  public readonly rdsInstance: rds.DatabaseInstance;
  public readonly chatSessionsTable: dynamodb.Table;

  constructor(scope: Construct, id: string, props: DatabaseProps) {
    super(scope, id, props);

    // RDS PostgreSQL Configuration
    const dbSecurityGroup = new ec2.SecurityGroup(this, 'DevDBSecurityGroup', {
      vpc: props.vpc,
      allowAllOutbound: true,
    });

    // DEV ONLY - restrict for production
    dbSecurityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(5432)
    );

    this.rdsInstance = new rds.DatabaseInstance(this, 'AirDiscoveryDBInstance', {
      engine: rds.DatabaseInstanceEngine.postgres({
        version: rds.PostgresEngineVersion.VER_17_5
      }),
      instanceType: props.instanceType ?? ec2.InstanceType.of(ec2.InstanceClass.T3, ec2.InstanceSize.MICRO),
      vpc: props.vpc,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PUBLIC,
      },
      publiclyAccessible: true,
      credentials: rds.Credentials.fromGeneratedSecret('postgres'),
      databaseName: 'discoverydb',
      securityGroups: [dbSecurityGroup],
      allocatedStorage: props.allocatedStorage ?? 20,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // DynamoDB Table for Chat Sessions
    this.chatSessionsTable = new dynamodb.Table(this, 'ChatSessionsTable', {
      tableName: 'airdiscovery-chat-sessions',
      partitionKey: {
        name: 'SessionId',
        type: dynamodb.AttributeType.STRING,
      },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      timeToLiveAttribute: 'TTL',
      pointInTimeRecovery: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // Global Secondary Index for querying by UserId
    this.chatSessionsTable.addGlobalSecondaryIndex({
      indexName: 'UserIdIndex',
      partitionKey: {
        name: 'UserId',
        type: dynamodb.AttributeType.STRING,
      },
      projectionType: dynamodb.ProjectionType.ALL,
    });

    // Outputs
    new cdk.CfnOutput(this, 'DBInstanceEndpoint', {
      value: this.rdsInstance.dbInstanceEndpointAddress,
      description: 'RDS Instance Endpoint',
      exportName: 'AirDiscoveryDBEndpoint',
    });

    new cdk.CfnOutput(this, 'DBInstancePort', {
      value: this.rdsInstance.dbInstanceEndpointPort,
      description: 'RDS Instance Port',
      exportName: 'AirDiscoveryDBPort',
    });

    if (this.rdsInstance.secret?.secretArn) {
      new cdk.CfnOutput(this, 'DBCredentialsSecretArn', {
        value: this.rdsInstance.secret.secretArn,
        description: 'RDS Credentials Secret ARN',
        exportName: 'AirDiscoveryDBSecretArn',
      });
    }

    new cdk.CfnOutput(this, 'ChatSessionsTableName', {
      value: this.chatSessionsTable.tableName,
      description: 'DynamoDB table name for chat sessions',
      exportName: 'AirDiscoveryChatSessionsTableName',
    });

    new cdk.CfnOutput(this, 'ChatSessionsTableArn', {
      value: this.chatSessionsTable.tableArn,
      description: 'DynamoDB table ARN for chat sessions',
      exportName: 'AirDiscoveryChatSessionsTableArn',
    });
  }
}

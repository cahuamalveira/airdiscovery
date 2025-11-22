import * as cdk from 'aws-cdk-lib';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as bedrock from 'aws-cdk-lib/aws-bedrock';
import { Construct } from 'constructs';

export interface BedrockKbStackProps extends cdk.StackProps {
  collectionArn: string; // OpenSearch Serverless collection ARN
  bucketArn: string; // S3 bucket ARN containing documents
  bedrockRoleArn: string; // Role ARN that Bedrock will assume for agent
}

export class BedrockKbStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: BedrockKbStackProps) {
    super(scope, id, props);

    // Knowledge Base
    const knowledgeBase = new bedrock.CfnKnowledgeBase(this, 'KnowledgeBase', {
      name: `${this.stackName}-kb`,
      description: 'Knowledge base for AirDiscovery',
      roleArn: props.bedrockRoleArn,
      knowledgeBaseConfiguration: {
        type: 'VECTOR',
        vectorKnowledgeBaseConfiguration: {
          embeddingModelArn: `arn:aws:bedrock:${this.region}::foundation-model/amazon.titan-embed-text-v1`
        }
      },
      storageConfiguration: {
        type: 'OPENSEARCH_SERVERLESS',
        opensearchServerlessConfiguration: {
          collectionArn: props.collectionArn,
          vectorIndexName: `${this.stackName}-index`,
          fieldMapping: {
            vectorField: 'vector',
            textField: 'text',
            metadataField: 'metadata'
          }
        }
      }
    });

    // Data Source (S3)
    new bedrock.CfnDataSource(this, 'DataSource', {
      knowledgeBaseId: knowledgeBase.ref,
      name: `${this.stackName}-datasource`,
      dataSourceConfiguration: {
        type: 'S3',
        s3Configuration: {
          bucketArn: props.bucketArn
        }
      }
    });

    // Agent
    const agentRole = new iam.Role(this, 'AgentExecutionRole', {
      assumedBy: new iam.ServicePrincipal('bedrock.amazonaws.com'),
      description: 'Role assumed by Bedrock Agent to access resources',
    });

    // Grant the role read access to the documents bucket if within same account (optional)
    // Note: we don't have a Bucket construct here; assume the provided role has needed permissions.

    new bedrock.CfnAgent(this, 'Agent', {
      agentName: `${this.stackName}-agent`,
      agentResourceRoleArn: props.bedrockRoleArn,
      autoPrepare: true,
      foundationModel: 'amazon.nova-premier-v1:0:8k',
      instruction: `You are AirDiscovery Assistant. Use the knowledge base to answer user queries.`,
      description: 'Agent for AirDiscovery knowledge base',
      idleSessionTtlInSeconds: 900,
      knowledgeBases: [{
        knowledgeBaseId: knowledgeBase.ref,
        description: 'AirDiscovery KB',
        knowledgeBaseState: 'ENABLED'
      }]
    });

    new cdk.CfnOutput(this, 'KnowledgeBaseRef', { value: knowledgeBase.ref });
  }
}

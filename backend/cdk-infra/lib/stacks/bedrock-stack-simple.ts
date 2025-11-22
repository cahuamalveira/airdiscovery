import * as cdk from 'aws-cdk-lib';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';

export interface BedrockStackProps extends cdk.StackProps {
  /**
   * O ID do Identity Pool do Cognito do Auth Stack
   * Usado para conceder permissões aos usuários autenticados
   */
  identityPoolId: string;
}

export class BedrockStack extends cdk.Stack {
  public readonly modelArn: string;
  public readonly bedrockRole: iam.Role;

  constructor(scope: Construct, id: string, props: BedrockStackProps) {
    super(scope, id, props);

    // Criar o ARN do modelo Amazon Nova Premier v1:0
    // ARNs de modelos Bedrock seguem o padrão: arn:aws:bedrock:{region}::foundation-model/{model-id}
    this.modelArn = `arn:aws:bedrock:${this.region}::foundation-model/amazon.nova-premier-v1:0`;

    // Criar role IAM para acesso ao Bedrock
    this.bedrockRole = new iam.Role(this, 'BedrockAccessRole', {
      roleName: 'AirDiscoveryBedrockRole',
      assumedBy: new iam.FederatedPrincipal(
        'cognito-identity.amazonaws.com',
        {
          StringEquals: {
            'cognito-identity.amazonaws.com:aud': props.identityPoolId,
          },
          'ForAnyValue:StringLike': {
            'cognito-identity.amazonaws.com:amr': 'authenticated',
          },
        },
        'sts:AssumeRoleWithWebIdentity'
      ),
      description: 'Role para usuários autenticados acessarem o modelo Amazon Bedrock Nova Premier',
    });

    // Adicionar permissões do Bedrock ao role
    this.bedrockRole.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          'bedrock:InvokeModel',
          'bedrock:InvokeModelWithResponseStream',
        ],
        resources: [this.modelArn],
        conditions: {
          StringEquals: {
            'aws:RequestedRegion': this.region,
          },
        },
      })
    );

    // Adicionar permissões adicionais do Bedrock para informações do modelo
    this.bedrockRole.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          'bedrock:GetFoundationModel',
          'bedrock:ListFoundationModels',
        ],
        resources: ['*'],
      })
    );


    

    // Outputs
    new cdk.CfnOutput(this, 'NovaModelArn', {
      value: this.modelArn,
      description: 'ARN do Modelo Amazon Nova Premier v1:0',
      exportName: 'AirDiscoveryNovaModelArn',
    });

    new cdk.CfnOutput(this, 'BedrockRoleArn', {
      value: this.bedrockRole.roleArn,
      description: 'ARN do Role IAM para acesso ao Bedrock',
      exportName: 'AirDiscoveryBedrockRoleArn',
    });

    new cdk.CfnOutput(this, 'Region', {
      value: this.region,
      description: 'Região AWS para serviços Bedrock',
      exportName: 'AirDiscoveryBedrockRegion',
    });
  }
}

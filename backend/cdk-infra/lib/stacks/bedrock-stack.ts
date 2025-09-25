import * as cdk from 'aws-cdk-lib';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';

export class BedrockStack extends cdk.Stack {
  public readonly modelArn: string;
  public readonly bedrockExecutionRole: iam.Role;

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Criar o ARN do modelo Amazon Nova Premier v1:0:8k
    // ARNs de modelos Bedrock seguem o padrão: arn:aws:bedrock:{region}::foundation-model/{model-id}
    this.modelArn = `arn:aws:bedrock:${this.region}::foundation-model/amazon.nova-premier-v1:0:8k`;

    // Criar role IAM para acesso ao Bedrock
    this.bedrockExecutionRole = new iam.Role(this, 'BedrockExecutionRole', {
      roleName: 'AirDiscoveryBedrockExecutionRole',
      assumedBy: new iam.CompositePrincipal(
        // Permitir que serviços da AWS assumam esta role
        new iam.ServicePrincipal('lambda.amazonaws.com'),
        new iam.ServicePrincipal('ecs-tasks.amazonaws.com'),
      ),
      description: 'Role para executar operações do Amazon Bedrock Nova Premier',
    });

    // Adicionar permissões do Bedrock ao role
    this.bedrockExecutionRole.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          'bedrock:InvokeModel',
          'bedrock:InvokeModelWithResponseStream',
        ],
        resources: [this.modelArn],
      })
    );

    // Adicionar permissões adicionais do Bedrock para informações do modelo
    this.bedrockExecutionRole.addToPolicy(
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
      description: 'ARN do Modelo Amazon Nova Premier v1:0:8k',
      exportName: 'AirDiscoveryNovaModelArn',
    });

    new cdk.CfnOutput(this, 'NovaModelId', {
      value: 'amazon.nova-premier-v1:0:8k',
      description: 'ID do Modelo Amazon Nova Premier v1:0:8k',
      exportName: 'AirDiscoveryNovaModelId',
    });

    new cdk.CfnOutput(this, 'BedrockExecutionRoleArn', {
      value: this.bedrockExecutionRole.roleArn,
      description: 'ARN da Role para executar operações do Bedrock',
      exportName: 'AirDiscoveryBedrockExecutionRoleArn',
    });

    new cdk.CfnOutput(this, 'BedrockRegion', {
      value: this.region,
      description: 'Região AWS para serviços Bedrock',
      exportName: 'AirDiscoveryBedrockRegion',
    });
  }
}

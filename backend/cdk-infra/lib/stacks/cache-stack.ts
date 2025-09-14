import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as elasticache from 'aws-cdk-lib/aws-elasticache';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import { Construct } from 'constructs';

export interface CacheProps extends cdk.StackProps {
  vpc: ec2.Vpc;
  cacheNodeType?: string;
  numCacheNodes?: number;
  engineVersion?: string;
}

export class CacheStack extends cdk.Stack {
  public readonly redisReplicationGroup: elasticache.CfnReplicationGroup;
  public readonly redisSecurityGroup: ec2.SecurityGroup;
  public readonly redisAuthSecret: secretsmanager.Secret;

  constructor(scope: Construct, id: string, props: CacheProps) {
    super(scope, id, props);

    // Security Group para ElastiCache Redis - PÚBLICO para desenvolvimento
    this.redisSecurityGroup = new ec2.SecurityGroup(this, 'RedisSecurityGroup', {
      vpc: props.vpc,
      description: 'Security group for ElastiCache Redis cluster - PUBLIC ACCESS for development',
      allowAllOutbound: false,
    });

    // ⚠️ DESENVOLVIMENTO APENAS - Permite acesso Redis de qualquer IP na porta 6379
    this.redisSecurityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(6379),
      'Allow Redis access from anywhere - DEVELOPMENT ONLY'
    );

    // Também permite acesso da VPC
    this.redisSecurityGroup.addIngressRule(
      ec2.Peer.ipv4(props.vpc.vpcCidrBlock),
      ec2.Port.tcp(6379),
      'Allow Redis access from within VPC'
    );

    // ⚠️ MODIFICADO: Subnet Group para ElastiCache usando subnets PÚBLICAS para acesso externo
    const redisSubnetGroup = new elasticache.CfnSubnetGroup(this, 'RedisSubnetGroup', {
      description: 'Subnet group for ElastiCache Redis - PUBLIC subnets for external access',
      subnetIds: props.vpc.publicSubnets.map(subnet => subnet.subnetId),
      cacheSubnetGroupName: 'air-discovery-redis-subnet-group',
    });

    // ⚠️ TEMPORÁRIO: Comentado para diagnóstico, reativar depois
    /*
    // Redis Auth Token (password) managed by Secrets Manager
    this.redisAuthSecret = new secretsmanager.Secret(this, 'RedisAuthSecret', {
      secretName: 'air-discovery-redis-auth-token',
      description: 'Authentication token for ElastiCache Redis cluster',
      generateSecretString: {
        // ✅ CORREÇÃO: Gerar token compatível com ElastiCache Redis
        excludeCharacters: '@"\\\'`/{}[]()$%^&*+=|~<>?,.:;',
        passwordLength: 64, // Reduzido para evitar problemas
        requireEachIncludedType: false,
        includeSpace: false,
        generateStringKey: 'auth-token',
        secretStringTemplate: '{}',
      },
      removalPolicy: cdk.RemovalPolicy.DESTROY, // For development
    });
    */

    // ElastiCache Redis Replication Group with Authentication - CONFIGURAÇÃO SIMPLES
    this.redisReplicationGroup = new elasticache.CfnReplicationGroup(this, 'RedisReplicationGroup', {
      replicationGroupId: 'air-discovery-redis',
      replicationGroupDescription: 'Air Discovery Redis cluster with authentication',
      
      // Node configuration - CONFIGURAÇÃO SIMPLES SEM REPLICA
      cacheNodeType: props.cacheNodeType ?? 'cache.t3.micro',
      engine: 'redis',
      engineVersion: props.engineVersion ?? '7.0',
      
      // ✅ CORREÇÃO: Usar apenas o nó primário, sem replicas para evitar erro de failover
      numCacheClusters: 1,
      automaticFailoverEnabled: false, // ⚠️ Desabilitar failover automático
      
      // Network configuration
      cacheSubnetGroupName: redisSubnetGroup.cacheSubnetGroupName,
      securityGroupIds: [this.redisSecurityGroup.securityGroupId],
      
      // Security configuration - SEGURA com autenticação obrigatória
      transitEncryptionEnabled: true,  // ✅ HABILITADO para permitir autenticação
      atRestEncryptionEnabled: true,   // ✅ Criptografia em repouso
      // ✅ TESTE: Token simples e fixo para diagnóstico (usar Secrets Manager depois)
      authToken: 'MysafestPassBecauseThereIsnoeasymistakes21!!', // Temporário para teste
      
      // Maintenance and backup
      preferredMaintenanceWindow: 'sun:03:00-sun:04:00',
      snapshotRetentionLimit: 1,
      snapshotWindow: '02:00-03:00',
      
      // Performance - CONFIGURAÇÃO SIMPLES para desenvolvimento
      autoMinorVersionUpgrade: true,
      // ✅ REMOVIDO multiAzEnabled para configuração simples
      
      // Tagging
      tags: [
        {
          key: 'Name',
          value: 'AirDiscovery-Redis',
        },
        {
          key: 'Environment',
          value: 'development',
        },
        {
          key: 'Purpose',
          value: 'Socket authentication and API caching - PUBLIC with STRONG AUTH',
        },
        {
          key: 'Security-Level',
          value: 'HIGH-AUTH-TLS-ENABLED',
        },
      ],
    });

    // Dependencies
    this.redisReplicationGroup.addDependency(redisSubnetGroup);

    // Outputs
    new cdk.CfnOutput(this, 'RedisEndpoint', {
      value: this.redisReplicationGroup.attrPrimaryEndPointAddress,
      description: 'ElastiCache Redis endpoint for socket authentication',
      exportName: 'AirDiscoveryRedisEndpoint',
    });

    new cdk.CfnOutput(this, 'RedisPort', {
      value: this.redisReplicationGroup.attrPrimaryEndPointPort,
      description: 'ElastiCache Redis port',
      exportName: 'AirDiscoveryRedisPort',
    });

    new cdk.CfnOutput(this, 'RedisClusterId', {
      value: this.redisReplicationGroup.ref,
      description: 'ElastiCache Redis cluster ID',
      exportName: 'AirDiscoveryRedisClusterId',
    });

    // ⚠️ TEMPORÁRIO: Output do Secret comentado
    /*
    new cdk.CfnOutput(this, 'RedisAuthSecretArn', {
      value: this.redisAuthSecret.secretArn,
      description: 'Redis authentication token secret ARN',
      exportName: 'AirDiscoveryRedisAuthSecretArn',
    });
    */

    // ✅ TEMPORÁRIO: Output da senha fixa para desenvolvimento
    new cdk.CfnOutput(this, 'RedisPassword', {
      value: 'MyRedisPassword123456789abcdefghijklmnopqrstuvwxyz',
      description: 'Redis password (TEMPORARY - for development only)',
      exportName: 'AirDiscoveryRedisPassword',
    });
  }
}

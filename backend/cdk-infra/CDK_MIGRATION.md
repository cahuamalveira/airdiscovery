# CDK Migration Guide

Este documento descreve o plano de migração do nosso monolítico `cdk-infra-stack.ts` para uma estrutura modular, facilitando a manutenção e evolução contínua.

---

## Objetivo

1. Modularizar a infraestrutura criando uma **Stack** para cada domínio ou serviço funcional importante.  
2. Garantir **independência** entre stacks e **reutilização** de componentes comuns (VPC, redes, parâmetros).  
3. Definir **convenções de nome**, estrutura de pastas e injeção de parâmetros (domínio, certificados ACM etc.).  
4. Fornecer diretrizes de **deploy incremental** e **compartilhamento** de recursos (por ex. VPC, Outputs/Exports).

---

## Estrutura de Pastas Sugerida

```
cdk-infra/
├─ bin/
│  └─ cdk-infra.ts                # Entrypoint: carrega e combina todas as Stacks
└─ lib/
   ├─ stacks/
   │  ├─ frontend-spa-stack.ts   # FrontendSpaModule
   │  ├─ auth-stack.ts           # AuthModule
   │  ├─ database-stack.ts       # DatabaseModule
   │  └─ messaging-stack.ts      # MessagingModule
   └─ shared/
      └─ vpc.ts                  # Definição de VPC compartilhada
```

---

## Exemplos de Stacks

### FrontendSpaModule

```ts
import { Stack, StackProps, CfnOutput } from 'aws-cdk-lib';
import { Bucket } from 'aws-cdk-lib/aws-s3';
import { Distribution, BehaviorOptions } from 'aws-cdk-lib/aws-cloudfront';
import { Construct } from 'constructs';

export interface FrontendSpaProps extends StackProps {
  domainName: string;
  certificateArn: string;
}

export class FrontendSpaStack extends Stack {
  constructor(scope: Construct, id: string, props: FrontendSpaProps) {
    super(scope, id, props);

    // ...existing code...

    const siteBucket = new Bucket(this, 'SpaBucket', {
      websiteIndexDocument: 'index.html',
      publicReadAccess: true,
    });

    const distribution = new Distribution(this, 'SpaDistribution', {
      defaultBehavior: <BehaviorOptions>{
        origin: /* …S3Origin from siteBucket… */,
        cachePolicy: /* … */,
      },
      domainNames: [props.domainName],
      certificate: /* ACM from props.certificateArn */,
    });

    new CfnOutput(this, 'SpaUrl', { value: `https://${props.domainName}` });
  }
}
```

### AuthModule

```ts
// ...existing code...
export class AuthStack extends Stack {
  constructor(scope: Construct, id: string, props: StackProps) {
    super(scope, id, props);

    // Cognito User Pool, Identity Pool, Roles e Policies
  }
}
```

### DatabaseModule

```ts
// ...existing code...
export class DatabaseStack extends Stack {
  // configura DynamoDB ou RDS
}
```

### MessagingModule

```ts
// ...existing code...
export class MessagingStack extends Stack {
  // configura SNS, SQS, EventBridge
}
```

---

## Arquivo Principal (`bin/cdk-infra.ts`)

```ts
#!/usr/bin/env node
import 'source-map-support/register';
import { App } from 'aws-cdk-lib';
import { FrontendSpaStack } from '../lib/stacks/frontend-spa-stack';
import { AuthStack } from '../lib/stacks/auth-stack';
import { DatabaseStack } from '../lib/stacks/database-stack';
import { MessagingStack } from '../lib/stacks/messaging-stack';
import { SharedVpc } from '../lib/shared/vpc';

const app = new App();

// VPC Compartilhada
const vpc = new SharedVpc(app, 'SharedVPC', { /* props */ });

// Instancia cada módulo
new FrontendSpaStack(app, 'FrontendSpaModule', {
  env: { region: 'us-east-1' },
  domainName: 'app.example.com',
  certificateArn: 'arn:aws:acm:…',
  vpc: vpc.vpc,
});

new AuthStack(app, 'AuthModule', { env: { /* … */ } });
// …database, messaging…

app.synth();
```

---

## Instruções de Migração

### ✅ **CONCLUÍDO** - Modularização já implementada

A modularização foi realizada com sucesso! Os seguintes stacks foram criados:

1. **SharedVpcStack** (`lib/shared/vpc.ts`) - VPC compartilhada entre todos os serviços
2. **FrontendSpaStack** (`lib/stacks/frontend-spa-stack.ts`) - S3 + CloudFront para hosting do SPA
3. **AuthStack** (`lib/stacks/auth-stack.ts`) - Cognito User Pool, Identity Pool e grupos
4. **DatabaseStack** (`lib/stacks/database-stack.ts`) - RDS PostgreSQL + DynamoDB
5. **CacheStack** (`lib/stacks/cache-stack.ts`) - ElastiCache Redis

### Próximos passos:

1. **Validar** com `cdk synth` para verificar a síntese dos templates
2. **Comparar** com `cdk diff` para ver as diferenças antes do deploy
3. **Deploy incremental** - execute cada stack conforme necessário:
   ```bash
   cdk deploy AirDiscoveryVpcStack
   cdk deploy AirDiscoveryFrontendStack
   cdk deploy AirDiscoveryAuthStack
   cdk deploy AirDiscoveryDatabaseStack
   cdk deploy AirDiscoveryCacheStack
   ```

### Backup criado:
- O stack monolítico original foi preservado em `lib/cdk-infra-stack.backup.ts`

### Deploy independente:
Agora você pode fazer deploy de stacks individuais conforme necessário, facilitando:
- Atualizações incrementais
- Rollbacks granulares  
- Desenvolvimento paralelo de diferentes componentes
- Melhor organização e manutenção do código

> **Resultado:** código CDK modular, fácil de manter, com stacks independentes e deploy incremental.

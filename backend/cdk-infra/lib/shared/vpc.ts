import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import { Construct } from 'constructs';

export interface SharedVpcProps extends cdk.StackProps {
  maxAzs?: number;
}

export class SharedVpcStack extends cdk.Stack {
  public readonly vpc: ec2.Vpc;

  constructor(scope: Construct, id: string, props?: SharedVpcProps) {
    super(scope, id, props);

    this.vpc = new ec2.Vpc(this, 'AppVPC', {
      maxAzs: props?.maxAzs ?? 2,
      subnetConfiguration: [{
        cidrMask: 24,
        name: 'public-subnet',
        subnetType: ec2.SubnetType.PUBLIC,
      }, {
        cidrMask: 24,
        name: 'private-subnet',
        subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS
      }]
    });

    // Outputs
    new cdk.CfnOutput(this, 'VpcId', {
      value: this.vpc.vpcId,
      description: 'VPC ID',
      exportName: 'AirDiscoveryVpcId',
    });

    new cdk.CfnOutput(this, 'VpcCidr', {
      value: this.vpc.vpcCidrBlock,
      description: 'VPC CIDR Block',
      exportName: 'AirDiscoveryVpcCidr',
    });
  }
}

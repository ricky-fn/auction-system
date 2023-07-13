import { CfnOutput } from "aws-cdk-lib";

export type IStackCfnOutputObject = {
  [key: string]: CfnOutput;
};
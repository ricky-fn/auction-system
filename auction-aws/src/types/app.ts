import { StackProps } from "aws-cdk-lib";

export type IAuctionStages = "dev" | "prod" | string;

export type IAuctionStageConfig = {
  branch: string;
  stageName: IAuctionStages;
  stageDomainParamName: string;
};

export interface IAppStackProps extends StackProps {
  stageConfig: IAuctionStageConfig;
}
import { StackProps } from "aws-cdk-lib";

export type IAuctionStages = "PRODUCTION" | "BETA" | "DEVELOPMENT" | "EXPERIMENTAL" | "PULL_REQUEST"

export type IAuctionStageConfig = {
  branch: string;
  stageName: IAuctionStages;
  stageDomainParamName: string;
};

export interface IAppStackProps extends StackProps {
  stageConfig: IAuctionStageConfig;
}
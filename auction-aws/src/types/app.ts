import { StackProps } from "aws-cdk-lib";

// reference: https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-resource-amplify-branch.html
export type IAuctionStages = "PRODUCTION" | "BETA" | "DEVELOPMENT" | "EXPERIMENTAL" | "PULL_REQUEST"

export type IAuctionStageConfig = {
  branch: string;
  stageName: IAuctionStages;
  stageDomainParamName: string;
};

export interface IAppStackProps extends StackProps {
  stageConfig: IAuctionStageConfig;
}
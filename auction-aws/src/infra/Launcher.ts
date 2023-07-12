import { App, StackProps } from "aws-cdk-lib";
import { AmplifyStack } from "./stacks/AmplifyStack";
import { CdkCicdStack } from "./stacks/CdkCiCdStack";
import { IAuctionStageConfig } from "../types";
import { capitalizeFirstLetter } from "./Utils";

const app = new App({
	context: {
		region: "ap-south-1",
	}
});

const repoString = "ricky-fn/auction-system";
const appRoot = "auction-aws";

const appStageConfig: IAuctionStageConfig[] = [
	{
		branch: "main",
		stageName: "PRODUCTION",
		stageDomainParamName: "prod-domain",
	},
	{
		branch: "dev",
		stageName: "DEVELOPMENT",
		stageDomainParamName: "dev-domain",
	},
];

const stackProps: StackProps = {
	env: {
		region: app.node.tryGetContext("region")
	},
};

new AmplifyStack(app, "AuctionAmplifyStack", {
	...stackProps,
	appStageConfig
});

appStageConfig.forEach((stageConfig) => {
	new CdkCicdStack(app, `AuctionCdkCiCdStack${capitalizeFirstLetter(stageConfig.stageName)}`, {
		...stackProps,
		repoString,
		appRoot,
		stageConfig
	});
});


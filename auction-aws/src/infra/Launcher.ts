import { App, StackProps } from "aws-cdk-lib";
import { AmplifyStack } from "./stacks/AmplifyStack";
import { CdkCicdStack } from "./stacks/CdkCiCdStack";
import { capitalizeFirstLetter } from "./Utils";
import createCloudformationStacks from "./stacks";
import appStageConfig from "./stageConfig.json";
import * as dotenv from "dotenv";

dotenv.config();

const app = new App({
	context: {
		region: process.env.CDK_DEFAULT_REGION,
	},
});

const repoString = process.env.GITHUB_REPO_STRING;
const appRoot = process.env.CDK_APP_ROOT;

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
	if (stageConfig.stageName === "DEVELOPMENT") {
		createCloudformationStacks(app, {
			...stackProps,
			stageConfig
		});
	} else {
		new CdkCicdStack(app, `AuctionCdkCiCdStack${capitalizeFirstLetter(stageConfig.stageName)}`, {
			...stackProps,
			repoString,
			appRoot,
			stageConfig
		});
	}
});
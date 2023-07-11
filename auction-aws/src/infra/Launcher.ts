import { App, StackProps } from "aws-cdk-lib";
import { AmplifyStack } from "./stacks/AmplifyStack";
import { CdkCicdStack } from "./stacks/CdkCiCdStack";

const app = new App({
	context: {
		region: "ap-south-1",
	}
});

const stackProps: StackProps = {
	env: {
		region: app.node.tryGetContext("region")
	},
};

const amplifyStack = new AmplifyStack(app, "AuctionAmplifyStack", stackProps);

const repoString = "ricky-fn/auction-system";
const appRoot = "auction-aws";

new CdkCicdStack(app, "AuctionProdCdkCiCdStack", {
	...stackProps,
	branch: "main",
	stageName: "prod",
	repoString,
	appRoot,
	appDomains: [amplifyStack.prodDomain]
});


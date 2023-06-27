import { App, StackProps } from "aws-cdk-lib";
import { LambdaStack } from "./stacks/LambdaStack";
import { DataStack } from "./stacks/DataStack";
import { AuthStack } from "./stacks/AuthStack";
import { ApiStack } from "./stacks/ApiStack";

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

const dataStack = new DataStack(app, "AuctionDataStack", stackProps);
const authStack = new AuthStack(app, "AuctionAuthStack", stackProps);
const lambdaStack = new LambdaStack(app, "AuctionLambdaStack", {
	...stackProps,
	itemsTable: dataStack.itemsTable,
	bidsTable: dataStack.bidsTable,
	depositTable: dataStack.depositTable
});
new ApiStack(app, "AuctionApiStack", {
	...stackProps,
	getItemsLambdaIntegration: lambdaStack.getItemsLambdaIntegration,
	userPool: authStack.userPool,
});

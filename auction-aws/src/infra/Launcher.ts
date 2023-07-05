import { App, StackProps } from "aws-cdk-lib";
import { LambdaStack } from "./stacks/LambdaStack";
import { DataStack } from "./stacks/DataStack";
import { AuthStack } from "./stacks/AuthStack";
import { ApiStack } from "./stacks/ApiStack";
import { ScheduleStack } from "./stacks/ScheduleStack";

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
const lambdaStack = new LambdaStack(app, "AuctionLambdaStack", {
	...stackProps,
	itemsTable: dataStack.itemsTable,
	bidsTable: dataStack.bidsTable,
	usersTable: dataStack.usersTable
});
const authStack = new AuthStack(app, "AuctionAuthStack", {
	...stackProps,
	userSignUpLambda: lambdaStack.userSignUpLambda,
	userSignInLambda: lambdaStack.userSignInLambda,
	photosBucket: dataStack.photosBucket
});
new ApiStack(app, "AuctionApiStack", {
	...stackProps,
	getItemsLambdaIntegration: lambdaStack.getItemsLambdaIntegration,
	getUserLambdaIntegration: lambdaStack.getUserLambdaIntegration,
	createItemLambdaIntegration: lambdaStack.createItemLambdaIntegration,
	depositLambdaIntegration: lambdaStack.depositLambdaIntegration,
	bidItemLambdaIntegration: lambdaStack.bidItemLambdaIntegration,
	userPool: authStack.userPool,
});
new ScheduleStack(app, "AuctionScheduleStack", {
	...stackProps,
	checkStatusLambda: lambdaStack.checkStatusLambda
});

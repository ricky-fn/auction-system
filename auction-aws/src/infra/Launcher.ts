import { App, StackProps } from "aws-cdk-lib";
import { LambdaStack } from "./stacks/LambdaStack";
import { DataStack } from "./stacks/DataStack";
import { AuthStack } from "./stacks/AuthStack";
import { ApiStack } from "./stacks/ApiStack";
import { ScheduleStack } from "./stacks/ScheduleStack";
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

// const dataStack = new DataStack(app, "AuctionDataStack", stackProps);
// const lambdaStack = new LambdaStack(app, "AuctionLambdaStack", {
// 	...stackProps,
// 	itemsTable: dataStack.itemsTable,
// 	bidsTable: dataStack.bidsTable,
// 	usersTable: dataStack.usersTable
// });
const amplifyStack = new AmplifyStack(app, "AuctionAmplifyStack", stackProps);
// const authStack = new AuthStack(app, "AuctionAuthStack", {
// 	...stackProps,
// 	userSignUpLambda: lambdaStack.userSignUpLambda,
// 	userSignInLambda: lambdaStack.userSignInLambda,
// 	photosBucket: dataStack.photosBucket,
// 	appDomains: amplifyStack.hostDomains
// });
// new ApiStack(app, "AuctionApiStack", {
// 	...stackProps,
// 	getItemsLambdaIntegration: lambdaStack.getItemsLambdaIntegration,
// 	getUserLambdaIntegration: lambdaStack.getUserLambdaIntegration,
// 	createItemLambdaIntegration: lambdaStack.createItemLambdaIntegration,
// 	depositLambdaIntegration: lambdaStack.depositLambdaIntegration,
// 	bidItemLambdaIntegration: lambdaStack.bidItemLambdaIntegration,
// 	getTotalBidAmountLambdaIntegration: lambdaStack.getTotalBidAmountLambdaIntegration,
// 	userPool: authStack.userPool,
// });
// new ScheduleStack(app, "AuctionScheduleStack", {
// 	...stackProps,
// 	checkStatusLambda: lambdaStack.checkStatusLambda
// });
new CdkCicdStack(app, "AuctionCdkCiCdStack", {
	...stackProps,
});
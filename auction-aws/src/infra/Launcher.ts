import { App } from "aws-cdk-lib";
import { LambdaStack } from "./stacks/LambdaStack";
import { DataStack } from "./stacks/DataStack";
import { AuthStack } from "./stacks/AuthStack";

const app = new App();

const dataStack = new DataStack(app, "AuctionDataStack");
new AuthStack(app, "AuctionAuthStack");
new LambdaStack(app, "AuctionLambdaStack", {
	itemsTable: dataStack.itemsTable,
	bidsTable: dataStack.bidsTable,
	depositTable: dataStack.depositTable
});
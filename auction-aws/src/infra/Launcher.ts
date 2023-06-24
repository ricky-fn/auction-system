import { App } from "aws-cdk-lib";
import { LambdaStack } from "./stacks/LambdaStack";
import { DataStack } from "./stacks/DataStack";

const app = new App();

const dataStack = new DataStack(app, "AuctionDataStack");
new LambdaStack(app, "AuctionLambdaStack", {
	itemsTable: dataStack.itemsTable,
	bidsTable: dataStack.bidsTable,
	depositTable: dataStack.depositTable
});
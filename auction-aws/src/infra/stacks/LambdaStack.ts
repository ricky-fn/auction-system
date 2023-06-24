import { Stack, StackProps } from "aws-cdk-lib";
import { ITable } from "aws-cdk-lib/aws-dynamodb";
import { Effect, PolicyStatement } from "aws-cdk-lib/aws-iam";
import { Runtime, Tracing } from "aws-cdk-lib/aws-lambda";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import { Construct } from "constructs";
import { join } from "path";

interface LambdaStackProps extends StackProps {
	itemsTable: ITable,
	bidsTable: ITable,
	depositTable: ITable
}

export class LambdaStack extends Stack {
	constructor(scope: Construct, id: string, props: LambdaStackProps) {
		super(scope, id, props);

		const auctionLambda = new NodejsFunction(this, "AuctionLambda", {
			runtime: Runtime.NODEJS_16_X,
			handler: "handler",
			entry: (join(__dirname, "..", "..", "services", "auction", "handler.ts")),
			environment: {
				TABLE_NAME: props.itemsTable.tableName
			},
			tracing: Tracing.ACTIVE,
		});

		auctionLambda.addToRolePolicy(new PolicyStatement({
			effect: Effect.ALLOW,
			resources: [props.itemsTable.tableArn, props.bidsTable.tableArn, props.depositTable.tableArn],
			actions: [
				"dynamodb:PutItem",
				"dynamodb:Scan",
				"dynamodb:GetItem",
				"dynamodb:UpdateItem",
				"dynamodb:DeleteItem"
			]
		}));
	}
}
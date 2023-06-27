import { Stack, StackProps } from "aws-cdk-lib";
import { LambdaIntegration } from "aws-cdk-lib/aws-apigateway";
import { ITable } from "aws-cdk-lib/aws-dynamodb";
import { Effect, PolicyStatement } from "aws-cdk-lib/aws-iam";
import { Runtime, Tracing } from "aws-cdk-lib/aws-lambda";
import { NodejsFunction, NodejsFunctionProps } from "aws-cdk-lib/aws-lambda-nodejs";
import { Construct } from "constructs";
import { join } from "path";

interface LambdaStackProps extends StackProps {
	itemsTable: ITable,
	bidsTable: ITable,
	depositTable: ITable
}

export class LambdaStack extends Stack {
	public readonly getItemsLambdaIntegration: LambdaIntegration;

	constructor(scope: Construct, id: string, props: LambdaStackProps) {
		super(scope, id, props);

		this.getItemsLambdaIntegration = new LambdaIntegration(this.createGetItemsLambda(props));
	}

	private getLambdaRuntime(props: NodejsFunctionProps) {
		return new NodejsFunction(this, "AuctionLambda", {
			runtime: Runtime.NODEJS_16_X,
			handler: "handler",
			tracing: Tracing.ACTIVE,
			...props
		});
	}

	private createGetItemsLambda(props: LambdaStackProps) {
		const getItemsLambda = this.getLambdaRuntime({
			entry: (join(__dirname, "..", "..", "services", "auction", "handler.ts")),
			environment: {
				TABLE_NAME: props.itemsTable.tableName
			}
		});

		getItemsLambda.addToRolePolicy(new PolicyStatement({
			effect: Effect.ALLOW,
			resources: [props.itemsTable.tableArn],
			actions: [
				"dynamodb:GetItem",
			]
		}));

		return getItemsLambda;
	}
}
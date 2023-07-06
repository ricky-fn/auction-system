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
	usersTable: ITable
}

export class LambdaStack extends Stack {
	public readonly getItemsLambdaIntegration: LambdaIntegration;
	public readonly createItemLambdaIntegration: LambdaIntegration;
	public readonly getUserLambdaIntegration: LambdaIntegration;
	public readonly depositLambdaIntegration: LambdaIntegration;
	public readonly bidItemLambdaIntegration: LambdaIntegration;
	public readonly getTotalBidAmountLambdaIntegration: LambdaIntegration;

	public readonly userSignUpLambda: NodejsFunction;
	public readonly userSignInLambda: NodejsFunction;
	public readonly checkStatusLambda: NodejsFunction;

	constructor(scope: Construct, id: string, props: LambdaStackProps) {
		super(scope, id, props);

		this.getItemsLambdaIntegration = new LambdaIntegration(this.createGetItemsLambda(props));
		this.getUserLambdaIntegration = new LambdaIntegration(this.createGetUserLambda(props));
		this.createItemLambdaIntegration = new LambdaIntegration(this.createCreateItemLambda(props));
		this.depositLambdaIntegration = new LambdaIntegration(this.createDepositLambda(props));
		this.bidItemLambdaIntegration = new LambdaIntegration(this.createBidItemLambda(props));
		this.getTotalBidAmountLambdaIntegration = new LambdaIntegration(this.createGetTotalBidAmountLambda(props));

		this.userSignUpLambda = this.createUserSignUpLambda(props);
		this.userSignInLambda = this.createUserSignInLambda(props);
		this.checkStatusLambda = this.createCheckStatusLambda(props);
	}

	private getLambdaRuntime(name: string, props: NodejsFunctionProps) {
		return new NodejsFunction(this, name, {
			runtime: Runtime.NODEJS_16_X,
			handler: "handler",
			tracing: Tracing.ACTIVE,
			...props
		});
	}

	private createGetItemsLambda(props: LambdaStackProps) {
		const getItemsLambda = this.getLambdaRuntime("GetItemsLambda", {
			entry: (join(__dirname, "..", "..", "services", "auction", "getItems.ts")),
			environment: {
				DB_ITEMS_TABLE: props.itemsTable.tableName
			}
		});

		getItemsLambda.addToRolePolicy(new PolicyStatement({
			effect: Effect.ALLOW,
			resources: [props.itemsTable.tableArn],
			actions: [
				"dynamodb:GetItem",
				"dynamodb:Scan",
				"dynamodb:Query",
			]
		}));

		return getItemsLambda;
	}

	private createUserSignUpLambda(props: LambdaStackProps) {
		const userSignUpLambda = this.getLambdaRuntime("UserSignUpLambda", {
			entry: (join(__dirname, "..", "..", "services", "auth", "signUp.ts")),
			environment: {
				DB_USERS_TABLE: props.usersTable.tableName
			}
		});

		userSignUpLambda.addToRolePolicy(new PolicyStatement({
			effect: Effect.ALLOW,
			resources: [props.usersTable.tableArn],
			actions: [
				"dynamodb:PutItem",
				"dynamodb:Query",
				"dynamodb:Scan",
				"dynamodb:GetItem",
				"dynamodb:UpdateItem",
			]
		}));

		return userSignUpLambda;
	}

	private createUserSignInLambda(props: LambdaStackProps) {
		const userSignUpLambda = this.getLambdaRuntime("UserSignInLambda", {
			entry: (join(__dirname, "..", "..", "services", "auth", "signIn.ts")),
			environment: {
				DB_USERS_TABLE: props.usersTable.tableName
			}
		});

		userSignUpLambda.addToRolePolicy(new PolicyStatement({
			effect: Effect.ALLOW,
			resources: [props.usersTable.tableArn],
			actions: [
				"dynamodb:PutItem",
				"dynamodb:Query",
				"dynamodb:Scan",
				"dynamodb:GetItem",
				"dynamodb:UpdateItem",
			]
		}));

		return userSignUpLambda;
	}

	private createGetUserLambda(props: LambdaStackProps) {
		const getUserLambda = this.getLambdaRuntime("GetUserLambda", {
			entry: (join(__dirname, "..", "..", "services", "auction", "protected", "getUser.ts")),
			environment: {
				DB_USERS_TABLE: props.usersTable.tableName
			}
		});

		getUserLambda.addToRolePolicy(new PolicyStatement({
			effect: Effect.ALLOW,
			resources: [props.usersTable.tableArn],
			actions: [
				"dynamodb:Query",
				"dynamodb:Scan",
				"dynamodb:GetItem",
			]
		}));

		return getUserLambda;
	}

	private createCreateItemLambda(props: LambdaStackProps) {
		const getUserLambda = this.getLambdaRuntime("CreateItemLambda", {
			entry: (join(__dirname, "..", "..", "services", "auction", "protected", "createItem.ts")),
			environment: {
				DB_ITEMS_TABLE: props.itemsTable.tableName,
				DB_USERS_TABLE: props.usersTable.tableName
			}
		});

		getUserLambda.addToRolePolicy(new PolicyStatement({
			effect: Effect.ALLOW,
			resources: [props.itemsTable.tableArn, props.usersTable.tableArn],
			actions: [
				"dynamodb:PutItem",
				"dynamodb:GetItem",
			]
		}));

		return getUserLambda;
	}

	private createCheckStatusLambda(props: LambdaStackProps) {
		const checkStatusLambda = this.getLambdaRuntime("CheckStatusLambda", {
			entry: (join(__dirname, "..", "..", "services", "auction", "checkStatus.ts")),
			environment: {
				DB_ITEMS_TABLE: props.itemsTable.tableName,
				DB_BIDS_TABLE: props.bidsTable.tableName,
				DB_USERS_TABLE: props.usersTable.tableName,
			}
		});

		checkStatusLambda.addToRolePolicy(new PolicyStatement({
			effect: Effect.ALLOW,
			resources: [props.itemsTable.tableArn, props.bidsTable.tableArn, props.usersTable.tableArn],
			actions: [
				"dynamodb:PutItem",
				"dynamodb:Query",
				"dynamodb:Scan",
				"dynamodb:GetItem",
				"dynamodb:UpdateItem",
				"dynamodb:BatchGetItem",
				"dynamodb:BatchWriteItem"
			]
		}));

		return checkStatusLambda;
	}

	private createDepositLambda(props: LambdaStackProps) {
		const depositLambda = this.getLambdaRuntime("DepositLambda", {
			entry: (join(__dirname, "..", "..", "services", "auction", "protected", "deposit.ts")),
			environment: {
				DB_USERS_TABLE: props.usersTable.tableName,
				DB_BIDS_TABLE: props.bidsTable.tableName,
			}
		});

		depositLambda.addToRolePolicy(new PolicyStatement({
			effect: Effect.ALLOW,
			resources: [props.usersTable.tableArn, props.bidsTable.tableArn],
			actions: [
				"dynamodb:GetItem",
				"dynamodb:UpdateItem",
				"dynamodb:PutItem",
			]
		}));

		return depositLambda;
	}

	private createBidItemLambda(props: LambdaStackProps) {
		const bidItemLambda = this.getLambdaRuntime("BidItemLambda", {
			entry: (join(__dirname, "..", "..", "services", "auction", "protected", "bidItem.ts")),
			environment: {
				DB_USERS_TABLE: props.usersTable.tableName,
				DB_BIDS_TABLE: props.bidsTable.tableName,
				DB_ITEMS_TABLE: props.itemsTable.tableName,
			}
		});

		bidItemLambda.addToRolePolicy(new PolicyStatement({
			effect: Effect.ALLOW,
			resources: [props.usersTable.tableArn, props.bidsTable.tableArn, props.itemsTable.tableArn],
			actions: [
				"dynamodb:GetItem",
				"dynamodb:UpdateItem",
				"dynamodb:PutItem",
				"dynamodb:Scan",
			]
		}));

		return bidItemLambda;
	}

	private createGetTotalBidAmountLambda(props: LambdaStackProps) {
		const getTotalBidAmountLambda = this.getLambdaRuntime("GetTotalBidAmountLambda", {
			entry: (join(__dirname, "..", "..", "services", "auction", "protected", "getTotalBidAmount.ts")),
			environment: {
				DB_BIDS_TABLE: props.bidsTable.tableName,
				DB_USERS_TABLE: props.usersTable.tableName,
				DB_ITEMS_TABLE: props.itemsTable.tableName,
			}
		});

		getTotalBidAmountLambda.addToRolePolicy(new PolicyStatement({
			effect: Effect.ALLOW,
			resources: [props.bidsTable.tableArn, props.usersTable.tableArn, props.itemsTable.tableArn],
			actions: [
				"dynamodb:Query",
				"dynamodb:Scan",
				"dynamodb:GetItem",
			]
		}));

		return getTotalBidAmountLambda;
	}
}
import { IAppStackProps, IStackCfnOutputObject } from "../../types";
import { DataStack } from "./DataStack";
import { LambdaStack } from "./LambdaStack";
import { AuthStack } from "./AuthStack";
import { ApiStack } from "./ApiStack";
import { ScheduleStack } from "./ScheduleStack";
import { Construct } from "constructs";

const createCloudformationStacks = (scope: Construct, props: any): { updateEnvVariableEndpoint: string, assets: { [key: string]: IStackCfnOutputObject } } => {
	const stackProps: IAppStackProps = {
		env: {
			region: props.env.region,
		},
		stageConfig: props.stageConfig,
	};

	const dataStack = new DataStack(scope, "AuctionDataStack", stackProps);
	const lambdaStack = new LambdaStack(scope, "AuctionLambdaStack", {
		...stackProps,
		itemsTable: dataStack.itemsTable,
		bidsTable: dataStack.bidsTable,
		usersTable: dataStack.usersTable
	});
	const authStack = new AuthStack(scope, "AuctionAuthStack", {
		...stackProps,
		userSignUpLambda: lambdaStack.userSignUpLambda,
		userSignInLambda: lambdaStack.userSignInLambda,
		photosBucket: dataStack.photosBucket,
	});
	const apiStack = new ApiStack(scope, "AuctionApiStack", {
		...stackProps,
		getItemsLambdaIntegration: lambdaStack.getItemsLambdaIntegration,
		getUserLambdaIntegration: lambdaStack.getUserLambdaIntegration,
		createItemLambdaIntegration: lambdaStack.createItemLambdaIntegration,
		depositLambdaIntegration: lambdaStack.depositLambdaIntegration,
		bidItemLambdaIntegration: lambdaStack.bidItemLambdaIntegration,
		getTotalBidAmountLambdaIntegration: lambdaStack.getTotalBidAmountLambdaIntegration,
		updateEnvVariablesLambdaIntegration: lambdaStack.updateEnvVariablesLambdaIntegration,
		userPool: authStack.userPool,
	});
	const scheduleStack = new ScheduleStack(scope, "AuctionScheduleStack", {
		...stackProps,
		checkStatusLambda: lambdaStack.checkStatusLambda
	});

	return {
		updateEnvVariableEndpoint: apiStack.getEnvFromCfnOutputValue("UpdateEnvVariablesEndpoint"),
		assets: {
			[dataStack.stackId]: dataStack.envFromCfnOutputs,
			[lambdaStack.stackId]: lambdaStack.envFromCfnOutputs,
			[authStack.stackId]: authStack.envFromCfnOutputs,
			[apiStack.stackId]: apiStack.envFromCfnOutputs,
			[scheduleStack.stackId]: scheduleStack.envFromCfnOutputs,
		}
	};
};

export default createCloudformationStacks;
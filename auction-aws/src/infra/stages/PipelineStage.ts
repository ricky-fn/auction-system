import { StackProps, Stage, StageProps } from "aws-cdk-lib";
import { Construct } from "constructs";
import { DataStack } from "../stacks/DataStack";
import { LambdaStack } from "../stacks/LambdaStack";
import { AmplifyStack } from "../stacks/AmplifyStack";
import { AuthStack } from "../stacks/AuthStack";
import { ApiStack } from "../stacks/ApiStack";
import { ScheduleStack } from "../stacks/ScheduleStack";
import { IAuctionStages } from "@/src/types";

interface PipelineStageProps extends StageProps {
	stageName: IAuctionStages;
	appDomains: string[];
}

export class PipelineStage extends Stage {

	constructor(scope: Construct, id: string, props: PipelineStageProps) {
		super(scope, id, props);

		const stackProps: StackProps = {
			env: {
				region: props.env.region,
			},
		};

		const dataStack = new DataStack(this, "AuctionDataStack", stackProps);
		const lambdaStack = new LambdaStack(this, "AuctionLambdaStack", {
			...stackProps,
			itemsTable: dataStack.itemsTable,
			bidsTable: dataStack.bidsTable,
			usersTable: dataStack.usersTable
		});
		const authStack = new AuthStack(this, "AuctionAuthStack", {
			...stackProps,
			userSignUpLambda: lambdaStack.userSignUpLambda,
			userSignInLambda: lambdaStack.userSignInLambda,
			photosBucket: dataStack.photosBucket,
			// appDomains: [amplifyStack.hostDomains]
			appDomains: ["http://localhost:3000"]
		});
		new ApiStack(this, "AuctionApiStack", {
			...stackProps,
			getItemsLambdaIntegration: lambdaStack.getItemsLambdaIntegration,
			getUserLambdaIntegration: lambdaStack.getUserLambdaIntegration,
			createItemLambdaIntegration: lambdaStack.createItemLambdaIntegration,
			depositLambdaIntegration: lambdaStack.depositLambdaIntegration,
			bidItemLambdaIntegration: lambdaStack.bidItemLambdaIntegration,
			getTotalBidAmountLambdaIntegration: lambdaStack.getTotalBidAmountLambdaIntegration,
			userPool: authStack.userPool,
		});
		new ScheduleStack(this, "AuctionScheduleStack", {
			...stackProps,
			checkStatusLambda: lambdaStack.checkStatusLambda
		});
	}
}
import { Stage, StageProps } from "aws-cdk-lib";
import { Construct } from "constructs";
import { DataStack } from "../stacks/DataStack";
import { LambdaStack } from "../stacks/LambdaStack";
import { AuthStack } from "../stacks/AuthStack";
import { ApiStack } from "../stacks/ApiStack";
import { ScheduleStack } from "../stacks/ScheduleStack";
import { IAuctionStageConfig, IAppStackProps } from "../../types";
import { capitalizeFirstLetter } from "../Utils";

interface PipelineStageProps extends StageProps {
	stageConfig: IAuctionStageConfig;
}

export class PipelineStage extends Stage {
	private suffix: string;

	constructor(scope: Construct, id: string, props: PipelineStageProps) {
		super(scope, id, props);

		const stackProps: IAppStackProps = {
			env: {
				region: props.env.region,
			},
			stageConfig: props.stageConfig,
		};

		this.suffix = capitalizeFirstLetter(props.stageConfig.stageName);

		const dataStack = new DataStack(this, `AuctionDataStack${this.suffix}`, stackProps);
		const lambdaStack = new LambdaStack(this, `AuctionLambdaStack${this.suffix}`, {
			...stackProps,
			itemsTable: dataStack.itemsTable,
			bidsTable: dataStack.bidsTable,
			usersTable: dataStack.usersTable
		});
		const authStack = new AuthStack(this, `AuctionAuthStack${this.suffix}`, {
			...stackProps,
			userSignUpLambda: lambdaStack.userSignUpLambda,
			userSignInLambda: lambdaStack.userSignInLambda,
			photosBucket: dataStack.photosBucket,
		});
		new ApiStack(this, `AuctionApiStack${this.suffix}`, {
			...stackProps,
			getItemsLambdaIntegration: lambdaStack.getItemsLambdaIntegration,
			getUserLambdaIntegration: lambdaStack.getUserLambdaIntegration,
			createItemLambdaIntegration: lambdaStack.createItemLambdaIntegration,
			depositLambdaIntegration: lambdaStack.depositLambdaIntegration,
			bidItemLambdaIntegration: lambdaStack.bidItemLambdaIntegration,
			getTotalBidAmountLambdaIntegration: lambdaStack.getTotalBidAmountLambdaIntegration,
			userPool: authStack.userPool,
			// appDomains: props.appDomains
		});
		new ScheduleStack(this, `AuctionScheduleStack${this.suffix}`, {
			...stackProps,
			checkStatusLambda: lambdaStack.checkStatusLambda
		});
	}
}
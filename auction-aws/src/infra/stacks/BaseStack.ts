import { App, CfnOutput, CfnOutputProps, Stack, StackProps, Stage } from "aws-cdk-lib";
import { IAuctionStageConfig, IAuctionStages, IStackCfnOutputObject } from "../../types";
import { Construct } from "constructs";
import appStageConfig from "../stageConfig.json";
import { capitalizeFirstLetter } from "../Utils";

class BaseStack extends Stack {
	public envFromCfnOutputs: IStackCfnOutputObject = {};
	public readonly stageName: IAuctionStages;
	public readonly suffix: string;
	public readonly stageConfig: IAuctionStageConfig | undefined;
	constructor(scope: Construct, id: string, props: StackProps) {
		super(scope, id, props);

		if (scope instanceof App || scope instanceof Stack) {
			this.stageName = "DEVELOPMENT";
		} else if (scope instanceof Stage) {
			this.stageName = scope.stageName as IAuctionStages;
		}

		this.stageConfig = appStageConfig.find((stageConfig) => stageConfig.stageName === this.stageName);
		if (!this.stageConfig) {
			throw new Error(`No stage config found for stage: ${this.stageName}`);
		}

		this.suffix = capitalizeFirstLetter(this.stageName.toLowerCase());
	}

	protected addEnvFromCfnOutputs(id: string, value: string) {
		if (this.envFromCfnOutputs[id]) {
			throw new Error(`CfnOutput with id: ${id} already exists`);
		}

		this.envFromCfnOutputs[id] = new CfnOutput(this, id, {
			value
		} as CfnOutputProps);
	}

	public getEnvFromCfnOutput(id: string): CfnOutput {
		if (!this.envFromCfnOutputs[id]) {
			return;
		}

		return this.envFromCfnOutputs[id];
	}

	public getEnvFromCfnOutputValue(id: string): string {
		if (!this.envFromCfnOutputs[id]) {
			return;
		}

		return this.envFromCfnOutputs[id].value;
	}
}

export default BaseStack;
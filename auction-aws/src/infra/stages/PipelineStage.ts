import { CfnOutput, Stage, StageProps } from "aws-cdk-lib";
import { Construct } from "constructs";
import { IStackCfnOutputObject } from "../../types";
import createCloudformationStacks from "../stacks";
import { flattenObject } from "../Utils";

export class PipelineStage extends Stage {
	public readonly stackCfnOutputs: { [key: string]: IStackCfnOutputObject };
	public readonly updateEnvVariableEndpoint: string;
	public readonly envFromCfnOutputs: { [key: string]: string };

	constructor(scope: Construct, id: string, props: StageProps & { stageName: string }) {
		super(scope, id, props);

		const stackProps = {
			env: {
				region: props.env.region,
			},
			stageName: props.stageName,
		};

		const { assets, updateEnvVariableEndpoint } = createCloudformationStacks(this, stackProps);

		this.updateEnvVariableEndpoint = updateEnvVariableEndpoint;

		this.stackCfnOutputs = assets;

		this.envFromCfnOutputs = flattenObject(this.stackCfnOutputs);
	}
}
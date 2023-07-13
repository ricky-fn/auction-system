import { Stage, StageProps } from "aws-cdk-lib";
import { Construct } from "constructs";
import { IAuctionStageConfig, IAppStackProps, IStackCfnOutputObject } from "../../types";
import createCloudformationStacks from "../stacks";
import { StringParameter } from "aws-cdk-lib/aws-ssm";

export class PipelineStage extends Stage {
	public readonly stackCfnOutputs: { [key: string]: IStackCfnOutputObject };
	public readonly updateEnvVariableEndpoint: string;
	constructor(scope: Construct, id: string, props: StageProps) {
		super(scope, id, props);

		const rawStageConfig = StringParameter.fromStringParameterAttributes(this, "stageConfig", {
			parameterName: `stage-${props.stageName}-config`
		}).stringValue;

		const stageConfig = JSON.parse(rawStageConfig) as IAuctionStageConfig;

		const stackProps: IAppStackProps = {
			env: {
				region: props.env.region,
			},
			stageConfig: stageConfig,
		};

		const result = createCloudformationStacks(this, stackProps);

		this.updateEnvVariableEndpoint = result.updateEnvVariableEndpoint;
		this.stackCfnOutputs = result.assets;
	}
}
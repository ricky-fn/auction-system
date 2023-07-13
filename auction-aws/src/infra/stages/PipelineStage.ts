import { Stage, StageProps } from "aws-cdk-lib";
import { Construct } from "constructs";
import { IAuctionStageConfig, IAppStackProps, IStackCfnOutputObject } from "../../types";
import createCloudformationStacks from "../stacks";

interface PipelineStageProps extends StageProps {
	stageConfig: IAuctionStageConfig;
}

export class PipelineStage extends Stage {
	public readonly stackCfnOutputs: { [key: string]: IStackCfnOutputObject };
	public readonly updateEnvVariableEndpoint: string;
	constructor(scope: Construct, id: string, props: PipelineStageProps) {
		super(scope, id, props);

		const stackProps: IAppStackProps = {
			env: {
				region: props.env.region,
			},
			stageConfig: props.stageConfig,
		};

		const result = createCloudformationStacks(this, stackProps);

		this.updateEnvVariableEndpoint = result.updateEnvVariableEndpoint;
		this.stackCfnOutputs = result.assets;
	}
}
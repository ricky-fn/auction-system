import { Stage, StageProps } from "aws-cdk-lib";
import { Construct } from "constructs";
import { IAuctionStageConfig, IAppStackProps } from "../../types";
import createCloudformationStacks from "../stacks";

interface PipelineStageProps extends StageProps {
	stageConfig: IAuctionStageConfig;
}

export class PipelineStage extends Stage {
	constructor(scope: Construct, id: string, props: PipelineStageProps) {
		super(scope, id, props);

		const stackProps: IAppStackProps = {
			env: {
				region: props.env.region,
			},
			stageConfig: props.stageConfig,
		};

		createCloudformationStacks(this, stackProps);
	}
}
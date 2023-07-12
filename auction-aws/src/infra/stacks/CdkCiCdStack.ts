import * as cdk from "aws-cdk-lib";
import { CodeBuildStep, CodePipeline, CodePipelineSource, ShellStep } from "aws-cdk-lib/pipelines";
import { Construct } from "constructs";
import { PipelineStage } from "./../stages/PipelineStage";
import { capitalizeFirstLetter } from "../Utils";
import { IAuctionStageConfig } from "../../types";

interface CdkCicdStackProps extends cdk.StackProps {
	repoString: string;
	appRoot: string;
	stageConfig: IAuctionStageConfig;
}

export class CdkCicdStack extends cdk.Stack {
	constructor(scope: Construct, id: string, props: CdkCicdStackProps) {
		super(scope, id, props);

		const { stageName, branch } = props.stageConfig;

		const pipeline = new CodePipeline(this, `AuctionPipeline${capitalizeFirstLetter(stageName)}`, {
			pipelineName: `AuctionPipeline${capitalizeFirstLetter(stageName)}`,
			synth: new ShellStep("Synth", {
				input: CodePipelineSource.gitHub(props.repoString, branch),
				commands: [
					`cd ${props.appRoot}`,
					"npm ci",
					"npx cdk synth"
				],
				primaryOutputDirectory: `${props.appRoot}/cdk.out`
			})
		});

		const stage = pipeline.addStage(new PipelineStage(this, `AuctionStage${capitalizeFirstLetter(stageName)}`, {
			env: props.env,
			stageConfig: props.stageConfig
		}));

		stage.addPre(new CodeBuildStep("unit-test", {
			commands: [
				`cd ${props.appRoot}`,
				"npm ci",
				"npm run test",
			]
		}));
	}
}

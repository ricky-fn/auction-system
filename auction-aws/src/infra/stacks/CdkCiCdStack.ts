import * as cdk from "aws-cdk-lib";
import { CodeBuildStep, CodePipeline, CodePipelineSource, ShellStep } from "aws-cdk-lib/pipelines";
import { Construct } from "constructs";
import { PipelineStage } from "./../stages/PipelineStage";
import { capitalizeFirstLetter } from "../Utils";
import { IAuctionStages } from "@/src/types";

interface CdkCicdStackProps extends cdk.StackProps {
	branch: string;
	stageName: IAuctionStages;
	repoString: string;
	appRoot: string;
	appDomains: string[];
}

export class CdkCicdStack extends cdk.Stack {
	constructor(scope: Construct, id: string, props: CdkCicdStackProps) {
		super(scope, id, props);

		const pipeline = new CodePipeline(this, "AuctionPipeline", {
			pipelineName: "AuctionPipeline",
			synth: new ShellStep("Synth", {
				input: CodePipelineSource.gitHub(props.repoString, props.branch),
				commands: [
					`cd ${props.appRoot}}`,
					"npm ci",
					"npx cdk synth"
				],
				primaryOutputDirectory: `${props.appRoot}/cdk.out`
			})
		});

		const stage = pipeline.addStage(new PipelineStage(this, `AuctionPipeline${capitalizeFirstLetter(props.stageName)}`, {
			env: props.env,
			stageName: props.stageName,
			appDomains: props.appDomains
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

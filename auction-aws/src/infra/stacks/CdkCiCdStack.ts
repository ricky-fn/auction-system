import * as cdk from "aws-cdk-lib";
import { CodeBuildStep, CodePipeline, CodePipelineSource, ShellStep } from "aws-cdk-lib/pipelines";
import { Construct } from "constructs";
import { PipelineStage } from "./../stages/PipelineStage";

export class CdkCicdStack extends cdk.Stack {
	constructor(scope: Construct, id: string, props?: cdk.StackProps) {
		super(scope, id, props);

		const pipeline = new CodePipeline(this, "AuctionPipeline", {
			pipelineName: "AuctionPipeline",
			synth: new ShellStep("Synth", {
				input: CodePipelineSource.gitHub("ricky-fn/auction-system", "main"),
				commands: [
					"cd auction-aws",
					"npm ci",
					"npx cdk synth"
				],
				primaryOutputDirectory: "auction-aws/cdk.out"
			})
		});

		const stage = pipeline.addStage(new PipelineStage(this, "PipelineProductionStage", {
			stageName: "production"
		}));

		stage.addPre(new CodeBuildStep("unit-test", {
			commands: [
				"cd auction-aws",
				"npm ci",
				"npm run test",
			]
		}));
	}
}

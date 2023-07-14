import { CodeBuildStep, CodePipeline, CodePipelineSource, ShellStep } from "aws-cdk-lib/pipelines";
import { Construct } from "constructs";
import { PipelineStage } from "./../stages/PipelineStage";
import { capitalizeFirstLetter } from "../Utils";
import { IAuctionStageConfig } from "../../types";
import { SecretValue, Stack, StackProps } from "aws-cdk-lib";

interface CdkCicdStackProps extends StackProps {
	repoString: string;
	appRoot: string;
	stageConfig: IAuctionStageConfig;
}

export class CdkCicdStack extends Stack {
	constructor(scope: Construct, id: string, props: CdkCicdStackProps) {
		super(scope, id, props);

		const { stageName, branch } = props.stageConfig;

		const pipeline = new CodePipeline(this, `AuctionPipeline${capitalizeFirstLetter(stageName)}`, {
			pipelineName: `AuctionPipeline${capitalizeFirstLetter(stageName)}`,
			synth: new ShellStep("Synth", {
				input: CodePipelineSource.gitHub(props.repoString, branch, {
					authentication: SecretValue.secretsManager("GITHUB_TOKEN_KEY")
				}),
				commands: [
					`cd ${props.appRoot}`,
					"npm ci",
					"npx cdk synth"
				],
				primaryOutputDirectory: `${props.appRoot}/cdk.out`
			})
		});

		const stage = new PipelineStage(this, `AuctionStage${capitalizeFirstLetter(stageName)}`, {
			env: props.env,
			stageName,
		});

		const pipelineStage = pipeline.addStage(stage);

		pipelineStage.addPre(new CodeBuildStep("unit-test", {
			commands: [
				`cd ${props.appRoot}`,
				"npm ci",
				"npm run test",
			]
		}));

		/**
		 * This step is used to update the environment variables of amplify branch.
		 * But the problem is that I can't call CfnOutput from the stage. the error is:
		 * CfnOutput at 'AuctionCdkCiCdStackBETA/AuctionStageBETA/test' should be created in the scope of a Stack, but no Stack found
		 * 
		 * I followed this documentation to solve the problem but it didn't work. this is a BUG in CDK.
		 * ref: https://docs.aws.amazon.com/cdk/api/v1/docs/pipelines-readme.html#using-cloudformation-stack-outputs-in-approvals
		 */
		// pipelineStage.addPost(new ShellStep("Output", {
		// 	envFromCfnOutputs: {
		// 		...flattenObject(stage.stackCfnOutputs)
		// 	},
		// 	commands: [`
		// 		curl --header "Content-Type: application/json"
		// 			--request POST
		// 			--data {"params":'${convertObjectToString(stage.stackCfnOutputs)}}'
		// 		${stage.updateEnvVariableEndpoint}"
		// 	`]
		// }));
	}
}

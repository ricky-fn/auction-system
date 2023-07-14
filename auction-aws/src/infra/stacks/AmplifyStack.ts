import { IAuctionStageConfig } from "./../../types/app";
import { App } from "@aws-cdk/aws-amplify-alpha";
import { aws_iam, CfnOutput, Stack, StackProps } from "aws-cdk-lib";
import { BuildSpec } from "aws-cdk-lib/aws-codebuild";
import { Construct } from "constructs";
import { ManagedPolicy, Role, ServicePrincipal } from "aws-cdk-lib/aws-iam";
import { GitHubSourceCodeProvider } from "@aws-cdk/aws-amplify-alpha/lib/source-code-providers";
import { SecretValue } from "aws-cdk-lib";
import { AwsCustomResource, AwsCustomResourcePolicy, PhysicalResourceId } from "aws-cdk-lib/custom-resources";
import { environmentVariables } from "../../environmentVariables";
import { StringParameter } from "aws-cdk-lib/aws-ssm";

interface IAmplifyStackProps extends StackProps {
	appStageConfig: IAuctionStageConfig[];
}

// todo export domain names
// todo create staging branch
export class AmplifyStack extends Stack {
	public amplifyApp: App;
	constructor(scope: Construct, id: string, props: IAmplifyStackProps) {
		super(scope, id, props);

		this.amplifyApp = this.createAmplifyApp();

		this.createBranches(props.appStageConfig);

		new AwsCustomResource(this, "auction-aws-custom", {
			onCreate: {
				service: "Amplify",
				action: "updateApp",
				parameters: {
					appId: this.amplifyApp.appId,
					platform: "WEB_COMPUTE",
				},
				physicalResourceId: PhysicalResourceId.of(
					"auction-next-amplify-custom-resource"
				),
			},

			policy: AwsCustomResourcePolicy.fromSdkCalls({
				resources: [this.amplifyApp.arn],
			}),
		});
	}
	private createBranches(appStageConfig: IAuctionStageConfig[]): void {
		appStageConfig.forEach((stageConfig) => {
			const branch = this.amplifyApp.addBranch(stageConfig.branch, {
				autoBuild: false, // set to true to automatically build the app on new pushes
				stage: stageConfig.stageName,
				performanceMode: stageConfig.stageName === "DEVELOPMENT"
			});

			const branchDomain = `${branch.branchName}.${this.amplifyApp.defaultDomain}`;

			new StringParameter(this, stageConfig.stageDomainParamName, {
				parameterName: stageConfig.stageDomainParamName,
				stringValue: branchDomain,
			});

			new StringParameter(this, `auction-amplify-${stageConfig.branch}-branch-arn`, {
				parameterName: `auction-amplify-${stageConfig.branch}-branch-arn`,
				stringValue: branch.arn,
			});
		});
	}
	private createAmplifyApp(): App {
		const amplifyRole = this.createAmplifyRole();
		const sourceCodeProvider = this.createSourceCodeProvider();
		const buildSpec = this.createBuildSpec();

		// Define Amplify app
		const amplifyApp = new App(this, "AuctionNextApp", {
			appName: "Auction Next App",
			description: "Jitera Auction App",
			role: amplifyRole,
			sourceCodeProvider: sourceCodeProvider,
			buildSpec: buildSpec,
			autoBranchDeletion: true,
			environmentVariables,
		});

		new StringParameter(this, "amplify-app-id", {
			parameterName: "auction-amplify-app-id",
			stringValue: amplifyApp.appId,
		});

		return amplifyApp;
	}
	private createAmplifyRole(): Role {
		const role = new Role(this, "AmplifyRoleWebApp", {
			assumedBy: new ServicePrincipal("amplify.amazonaws.com"),
			description: "Custom role permitting resources creation from Amplify",
			managedPolicies: [ManagedPolicy.fromAwsManagedPolicyName("AdministratorAccess-Amplify")],
		});
		return role;
	}
	private createSourceCodeProvider(): GitHubSourceCodeProvider {
		const sourceCodeProvider = new GitHubSourceCodeProvider({
			oauthToken: SecretValue.secretsManager("GITHUB_TOKEN_KEY"), // replace GITHUB_TOKEN_KEY by the name of the Secrets Manager resource storing your GitHub token
			// next two lines can read from Secrets Manager as well
			owner: "ricky-fn",
			repository: "auction-system",
		});

		return sourceCodeProvider;
	}
	private createBuildSpec(): BuildSpec {
		const buildSpec = BuildSpec.fromObjectToYaml({
			version: "1.0",
			applications: [
				{
					appRoot: "auction-frontend",
					frontend: {
						phases: {
							preBuild: {
								commands: [
									// Install the correct Node version, defined in .nvmrc
									"nvm install",
									// Use the correct Node version
									"nvm use",
									// Avoid memory issues with node
									"export NODE_OPTIONS=--max-old-space-size=8192",
									// Ensure node_modules are correctly included in the build artifacts
									"npm install",
								],
							},
							build: {
								commands: [
									// Allow Next.js to access environment variables
									// See https://docs.aws.amazon.com/amplify/latest/userguide/ssr-environment-variables.html
									`env | grep -E '${Object.keys(environmentVariables).join("|")}' >> .env.production`,
									"echo $CDK_RESOURCES > ../auction-shared/outputs.json",
									// Build Next.js app
									"npx next build --no-lint",
								],
							},
							postBuild: {
								commands: [
									"npm run test:ci",
									"npm run e2e:headless"
								]
							}
						},
						artifacts: {
							baseDirectory: ".next",
							files: ["**/*"],
						},
						cache: {
							paths: ["node_modules/**/*", ".next/**/*"],
						}
					},
				},
			],
		});
		return buildSpec;
	}
}
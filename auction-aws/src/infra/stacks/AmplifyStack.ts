import { App } from "@aws-cdk/aws-amplify-alpha";
import { aws_iam, CfnOutput, Stack, StackProps } from "aws-cdk-lib";
import { BuildSpec } from "aws-cdk-lib/aws-codebuild";
import { Construct } from "constructs";
import { ManagedPolicy, Role, ServicePrincipal } from "aws-cdk-lib/aws-iam";
import { GitHubSourceCodeProvider } from "@aws-cdk/aws-amplify-alpha/lib/source-code-providers";
import { SecretValue } from "aws-cdk-lib";
import { AwsCustomResource, AwsCustomResourcePolicy, PhysicalResourceId } from "aws-cdk-lib/custom-resources";
import { environmentVariables } from "../../environmentVariables";


// todo export domain names
// todo create staging branch
export class AmplifyStack extends Stack {
	public amplifyApp: App;
	public hostDomains: string[];
	constructor(scope: Construct, id: string, props?: StackProps) {
		super(scope, id, props);

		this.amplifyApp = this.createAmplifyApp();

		this.createBranches();

		new AwsCustomResource(this, "aws-custom", {
			onCreate: {
				service: "Amplify",
				action: "updateApp",
				parameters: {
					appId: this.amplifyApp.appId,
					platform: "WEB_COMPUTE",
				},
				physicalResourceId: PhysicalResourceId.of(
					"test-amplify-custom-resource"
				),
			},

			policy: AwsCustomResourcePolicy.fromSdkCalls({
				resources: [this.amplifyApp.arn],
			}),
		});
	}
	private createBranches(): void {
		const mainBranch = this.amplifyApp.addBranch("main", {
			autoBuild: false, // set to true to automatically build the app on new pushes
			stage: "PRODUCTION",
		});

		const devBranch = this.amplifyApp.addBranch("dev", {
			autoBuild: false, // set to true to automatically build the app on new pushes
			performanceMode: true,
			// todo add build spec
		});

		const mainBranchDomain = `${mainBranch.branchName}.${this.amplifyApp.defaultDomain}`;
		const devBranchDomain = `${devBranch.branchName}.${this.amplifyApp.defaultDomain}`;

		this.hostDomains = [mainBranchDomain, devBranchDomain];
	}
	private createAmplifyApp(): App {
		const amplifyRole = this.createAmplifyRole();
		const sourceCodeProvider = this.createSourceCodeProvider();
		const buildSpec = this.createBuildSpec();

		// Define Amplify app
		const amplifyApp = new App(this, "AmplifyAppResource", {
			appName: "Auction System",
			description: "Jitera Auction System",
			role: amplifyRole,
			sourceCodeProvider: sourceCodeProvider,
			buildSpec: buildSpec,
			autoBranchDeletion: true,
			environmentVariables,
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
			owner: "ricky-fn", // ! read from env
			repository: "auction-system", // ! read from env
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
									// Build Next.js app
									"npx next build --no-lint",
								],
							},
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
import { Duration, Stack, StackProps } from "aws-cdk-lib";
import { Construct } from "constructs";
import { Rule, Schedule } from "aws-cdk-lib/aws-events";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import { LambdaFunction } from "aws-cdk-lib/aws-events-targets";

interface ScheduleStackProps extends StackProps {
	checkStatusLambda: NodejsFunction
}

export class ScheduleStack extends Stack {
	private rule: Rule;

	constructor(scope: Construct, id: string, props: ScheduleStackProps) {
		super(scope, id, props);
		this.initRule(props);
	}

	private initRule(props: ScheduleStackProps) {
		this.rule = new Rule(this, "StatusCheckRule", {
			description: "Checks the status of the auction items every 5 minutes",
			schedule: Schedule.rate(Duration.minutes(5)),
			targets: [
				new LambdaFunction(props.checkStatusLambda)
			]
		});
	}
}
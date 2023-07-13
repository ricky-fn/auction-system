/**
 * v 0.1.0
 * Receive a CloudFormation assets json and update the branch environment variables in the amplify project
 * 
 * Errors:
 * Internal Error: I001, I002, I003, I004, I005
 * Bad Request: B001, B002
 */

import { AmplifyClient, UpdateBranchCommand, GetBranchCommand, Branch } from "@aws-sdk/client-amplify";
import { BadRequest, createLambdaResponse, InternalError } from "@/src/services/auction/utils";
import { APIGatewayProxyEvent } from "aws-lambda";
import { ApiRequestParams } from "auction-shared/api";

const APP_ID = process.env.APP_ID as string;
const REGION = process.env.REGION as string;
const BRANCH = process.env.BRANCH as string;

export const handler = async (event: APIGatewayProxyEvent) => {
	const result = parseInputParameter(event);

	if (result instanceof BadRequest) {
		return result.getResponse();
	}

	const checkResult = checkRunTimeEnv();
	if (checkResult instanceof InternalError) {
		return checkResult.getResponse();
	}

	const { params: amplifyEnvVariables } = result;

	const client = new AmplifyClient({ region: REGION });

	let branch: Branch;
	try {
		const response = await client.send(new GetBranchCommand({
			appId: APP_ID,
			branchName: BRANCH,
		}));
		branch = response.branch;
	} catch (err) {
		const error = new InternalError("I004", err.message);
		return error.getResponse();
	}

	const updatedEnv = {
		...branch.environmentVariables,
		...amplifyEnvVariables,
	};

	try {
		await client.send(new UpdateBranchCommand({
			appId: APP_ID,
			branchName: BRANCH,
			environmentVariables: updatedEnv
		}));
	} catch (err) {
		const error = new InternalError("I005", err.message);
		return error.getResponse();
	}

	return createLambdaResponse(200, {});
};

function parseInputParameter(event: APIGatewayProxyEvent) {
	if (!event.body) {
		return new BadRequest("B001", "Input parameter is required");
	}

	const input = JSON.parse(event.body) as ApiRequestParams["update-amplify-env"];

	if (!input.params) {
		return new BadRequest("B002", "params is required");
	}

	return input;
}

function checkRunTimeEnv() {
	if (!APP_ID) {
		return new InternalError("I001", "APP_ID is required");
	}

	if (!REGION) {
		return new InternalError("I002", "REGION is required");
	}

	if (!BRANCH) {
		return new InternalError("I003", "BRANCH is required");
	}
}
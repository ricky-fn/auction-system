import { APIGatewayProxyResult, APIGatewayEventRequestContext, Context } from "aws-lambda";
import { LambdaResponse } from "../../../../types";

// Lambda Error Helper
export const lambdaErrorHelper = {
	handleError: (errorCode: number, errorMessage: string): APIGatewayProxyResult => {
		return {
			statusCode: errorCode,
			headers: {
				"Access-Control-Allow-Origin": "*"
			},
			body: JSON.stringify({
				timestamp: Date.now(),
				error: errorMessage,
			}),
		};
	},

	// Method to handle internal server errors
	handleInternalError: (errorCode: string, errorMessage: unknown, context: APIGatewayEventRequestContext | Context): APIGatewayProxyResult => {
		console.log(`Internal Server Error [${errorCode}]: ${errorMessage}`, context);
		return lambdaErrorHelper.handleError(500, `${errorCode} Internal Server Error`);
	},

	// Method to handle authorization failures
	handleAuthorizationFail: (errorCode: string, errorMessage: unknown, context: APIGatewayEventRequestContext | Context): APIGatewayProxyResult => {
		console.log(`Authorization Failure [${errorCode}]: ${errorMessage}`, context);
		return lambdaErrorHelper.handleError(401, `${errorCode} Authorization failed`);
	},

	// Method to handle bad requests
	handleBadRequest: (errorCode: string, errorMessage: unknown, context: APIGatewayEventRequestContext | Context): APIGatewayProxyResult => {
		console.log(`Bad Request [${errorCode}]: ${errorMessage}`, context);
		return lambdaErrorHelper.handleError(400, `${errorCode} Bad Request`);
	},
};

export const createLambdaResponse = <T>(
	statusCode: number,
	data?: T
): LambdaResponse<T> => {
	return {
		statusCode,
		headers: {
			"Access-Control-Allow-Origin": "*",
			"Content-Type": "application/json",
		},
		body: JSON.stringify({
			timestamp: Date.now(),
			data
		}),
	};
};
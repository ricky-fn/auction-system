/**
 * v 0.1.0
 * Registration function
 * 
 * Errors:
 * Bad Request: B001
 * Internal Error: I001
 * Authorization Fail: A001, A002
 */
import { DynamoDBClient, GetItemCommand } from "@aws-sdk/client-dynamodb";
import { unmarshall } from "@aws-sdk/util-dynamodb";
import { User } from "auction-shared/models";
import { APIGatewayProxyEvent } from "aws-lambda";
import { createLambdaResponse, AuthorizationFail, InternalError } from "../utils";
import { ApiResponseList } from "auction-shared/api";

const dbClient = new DynamoDBClient({});
const DB_USERS_TABLE = process.env.DB_USERS_TABLE;

export async function handler(event: APIGatewayProxyEvent) {
	const userId = event.requestContext.authorizer?.claims["cognito:username"] || null;

	if (!userId) {
		const error = new AuthorizationFail("A001", "username is required");
		return error.getResponse();
	}

	let user: User | undefined;
	try {
		user = await getUserByUsername(userId);
	} catch (err) {
		const error = new InternalError("I001", err.message);
		return error.getResponse();
	}

	if (!user) {
		const error = new AuthorizationFail("A002", "User not found");
		return error.getResponse();
	}

	return createLambdaResponse<ApiResponseList["get-user"]>(200, {
		timestamp: Date.now(),
		data: user
	});
}

// Function to retrieve user by username from DynamoDB
async function getUserByUsername(userId: string): Promise<User | undefined> {
	// Create the parameters for the DynamoDB query

	const getItemResponse = await dbClient.send(new GetItemCommand({
		TableName: DB_USERS_TABLE,
		Key: {
			"id": { S: userId }
		}
	}));
	if (getItemResponse.Item) {
		const unmashalledItem = unmarshall(getItemResponse.Item) as User;
		return unmashalledItem;
	}
	return undefined;
}
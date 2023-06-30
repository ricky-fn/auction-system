import { DynamoDB } from "aws-sdk";
/**
 * Registration function
 * 
 * @example
 * {
 *   "username": "ducky.test@gmail.com",
 *   "password": "abc123123111"
 * }
 * 
 * Errors:
 * Bad Request: B001
 * Internal Error: I001, I002
 */
import { DynamoDBClient, GetItemCommand, PutItemCommand } from "@aws-sdk/client-dynamodb";
import { marshall, unmarshall } from "@aws-sdk/util-dynamodb";
import { User } from "auction-shared/models";
import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { createLambdaResponse, lambdaErrorHelper } from "../utils";

const dbClient = new DynamoDBClient({});
const DB_USERS_TABLE = process.env.DB_USERS_TABLE;

export async function handler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
	const userId = event.requestContext.authorizer?.claims["cognito:username"] || null;

	if (!userId) {
		return lambdaErrorHelper.handleBadRequest("B001", "Missing userId", event.requestContext);
	}

	const user = await getUserByUsername(userId);

	return createLambdaResponse<{ user: User }>(200, { user });
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
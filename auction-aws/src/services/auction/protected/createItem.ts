/**
 * v 0.1.0
 * Allows user to create an item
 * 
 * @example
 * {
 *   "name": "Example Item",
 *   "startingPrice": 100,
 *   "timeWindow": 3600
 * }
 * 
 * Errors:
 * Bad Request: B001, B002, B003, B004, B005, B006, B007
 * Internal Error: I001, I002
 * Authorization Fail: A001, A002
 */

import { APIGatewayProxyEvent } from "aws-lambda";
import { DynamoDBClient, GetItemCommand, PutItemCommand } from "@aws-sdk/client-dynamodb";
import { Item, User } from "auction-shared/models";
import { createLambdaResponse, AuthorizationFail, BadRequest, InternalError, uuid } from "@/src/services/auction/utils";
import { marshall, unmarshall } from "@aws-sdk/util-dynamodb";
import { ApiRequestParams, ApiResponseList } from "auction-shared/api";

const dbClient = new DynamoDBClient({});
const DB_ITEMS_TABLE = process.env.DB_ITEMS_TABLE;
const DB_USERS_TABLE = process.env.DB_USERS_TABLE;

export const handler = async (event: APIGatewayProxyEvent) => {
	const result = parseInputParameter(event);

	if (result instanceof BadRequest) {
		return result.getResponse();
	}

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

	// Assign a predefined itemId based on your business logic
	const itemId = uuid("item");

	// Get the current timestamp
	const createdAt = Date.now();

	const newItem: Item = {
		...result,
		startingPrice: Number(result.startingPrice),
		itemId,
		createdAt,
		createdBy: userId,
		status: "ongoing",
	};

	// Create a new item in the Items table
	try {
		await dbClient.send(new PutItemCommand({
			TableName: DB_ITEMS_TABLE,
			Item: marshall(newItem)
		}));
	} catch (err) {
		const error = new InternalError("I002", err.message);
		return error.getResponse();
	}

	return createLambdaResponse<ApiResponseList["create-item"]>(200, {
		timestamp: Date.now(),
		data: newItem
	});
};

const parseInputParameter = (event: APIGatewayProxyEvent): BadRequest | ApiRequestParams["create-item"] => {
	if (!event.body) {
		return new BadRequest("B001", "Input parameter is required");
	}

	const input = JSON.parse(event.body) as ApiRequestParams["create-item"];

	if (!input.name) {
		return new BadRequest("B002", "name is required");
	}

	if (!input.startingPrice) {
		return new BadRequest("B003", "startingPrice is required");
	}

	if (isNaN(input.startingPrice)) {
		return new BadRequest("B004", "startingPrice must be a number");
	}

	if (input.startingPrice <= 0) {
		return new BadRequest("B005", "startingPrice must be greater than 0");
	}

	if (!input.expirationTime) {
		return new BadRequest("B006", "expirationTime is required");
	}

	const regex = /^(\d+)h$/;
	const match = input.expirationTime.match(regex);
	if (!match) {
		return new BadRequest("B007", "expirationTime must be in the format of {number}h");
	}

	return input;
};

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
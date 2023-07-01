/**
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
 * Internal Error: I001, I002, I003
 * Authorization Fail: A001
 */

import { APIGatewayProxyEvent } from "aws-lambda";
import { DynamoDBClient, PutItemCommand } from "@aws-sdk/client-dynamodb";
import { Item } from "auction-shared/models";
import { createLambdaResponse, AuthorizationFail, BadRequest, InternalError } from "@/src/services/auction/utils";
import { marshall } from "@aws-sdk/util-dynamodb";
import { ApiList } from "auction-shared/api";

const dbClient = new DynamoDBClient({});
const DB_ITEMS_TABLE = process.env.DB_ITEMS_TABLE;

export type createItemInputParameters = Omit<Item, "itemId" | "createdBy" | "highestBid" | "highestBidder" | "lastBidTimestamp" | "timestamp">

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

	// Assign a predefined itemId based on your business logic
	const itemId = assignItemId();

	// Get the current timestamp
	const timestamp = Math.floor(Date.now() / 1000);

	const newItem: Item = {
		...result,
		itemId,
		timestamp,
		createdBy: userId,
	};

	// Create a new item in the Items table
	try {
		await dbClient.send(new PutItemCommand({
			TableName: DB_ITEMS_TABLE,
			Item: marshall(newItem)
		}));
	} catch (err) {
		const error = new InternalError("I001", err.message);
		return error.getResponse();
	}

	return createLambdaResponse<ApiList["create-item"]>(200, {
		timestamp: Date.now(),
		data: {
			item: newItem
		}
	});
};

const parseInputParameter = (event: APIGatewayProxyEvent): BadRequest | createItemInputParameters => {
	if (!event.body) {
		return new BadRequest("B001", "Input parameter is required");
	}

	const input = JSON.parse(event.body) as createItemInputParameters;

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

	const oneHourInMillis = 3600000;
	const oneHourAhead = Date.now() + oneHourInMillis;
	if (oneHourAhead > input.expirationTime) {
		return new BadRequest("B007", "expirationTime must be one hour ahead from now");
	}

	return input;
};

// Function to generate a unique itemId
const assignItemId = (): string => {
	const timestamp = new Date().getTime();
	const randomId = Math.floor(Math.random() * 10000);
	return `item-${timestamp}-${randomId}`;
};
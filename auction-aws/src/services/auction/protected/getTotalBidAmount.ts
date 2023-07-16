/**
 * v 0.1.0
 * retrieve total bid amount for a user
 * 
 * Errors:
 * Bad Request: B001, B002
 * Internal Error: I001, I002, I003,
 * Authorization Fail: A001, A002
 */
import { DynamoDBClient, GetItemCommand, ScanCommand } from "@aws-sdk/client-dynamodb";
import { unmarshall } from "@aws-sdk/util-dynamodb";
import { BidRecord, Item, User } from "auction-shared/models";
import { APIGatewayProxyEvent } from "aws-lambda";
import { createLambdaResponse, AuthorizationFail, InternalError, BadRequest } from "../utils";
import { ApiRequestParams, ApiResponseList } from "auction-shared/api";

const dbClient = new DynamoDBClient({});
const DB_USERS_TABLE = process.env.DB_USERS_TABLE;
const DB_BIDS_TABLE = process.env.DB_BIDS_TABLE;
const DB_ITEMS_TABLE = process.env.DB_ITEMS_TABLE;

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


	// Check if the item exists
	let item: Item;
	try {
		item = await getItem(result.itemId);
	} catch (err) {
		const error = new InternalError("I002", err.message);
		return error.getResponse();
	}

	if (!item) {
		const error = new BadRequest("B006", "Item not found");
		return error.getResponse();
	}

	let bidRecords: BidRecord[];
	try {
		bidRecords = await getBidRecords(item.itemId, userId);
	} catch (err) {
		const error = new InternalError("I003", err.message);
		return error.getResponse();
	}

	const totalBidAmount = bidRecords.reduce((acc, cur) => acc + cur.amount, 0);

	return createLambdaResponse<ApiResponseList["get-total-bid-amount"]>(200, {
		timestamp: Date.now(),
		data: totalBidAmount
	});
};


const parseInputParameter = (event: APIGatewayProxyEvent): BadRequest | ApiRequestParams["get-total-bid-amount"] => {
	if (!event.queryStringParameters) {
		return new BadRequest("B001", "Input parameter is required");
	}

	const input = event.queryStringParameters as ApiRequestParams["get-total-bid-amount"];

	if (!input.itemId) {
		return new BadRequest("B002", "itemId is required");
	}

	return input;
};

// Function to retrieve an item by itemId
async function getItem(itemId: string): Promise<Item | undefined> {
	const getItemResponse = await dbClient.send(new GetItemCommand({
		TableName: DB_ITEMS_TABLE,
		Key: {
			"itemId": { S: itemId }
		}
	}));
	if (getItemResponse.Item) {
		const unmashalledItem = unmarshall(getItemResponse.Item) as Item;
		return unmashalledItem;
	}
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

// Function to retrieve bid records by itemId and user ID from DynamoDB and return the total bid amount
async function getBidRecords(itemId: string, userId: string): Promise<BidRecord[] | undefined> {
	const getItemResponse = await dbClient.send(new ScanCommand({
		TableName: DB_BIDS_TABLE,
		FilterExpression: "itemId = :itemId and bidderId = :bidderId",
		ExpressionAttributeValues: {
			":itemId": { S: itemId },
			":bidderId": { S: userId }
		}
	}));
	if (getItemResponse.Items) {
		const unmashalledItem = getItemResponse.Items.map(item => unmarshall(item) as BidRecord);
		return unmashalledItem;
	}
	return [];
}

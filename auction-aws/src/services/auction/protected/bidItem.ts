/**
 * v0.1.3
 * Allows user to bid an item, the price must be higher than current highest price
 * 
 * Errors:
 * Bad Request: B001, B002, B003, B004, B005, B006, B007, B008, B009, B010, B011
 * Internal Error: I001, I002, I003, I004, I005
 * Authorization Fail: A001, A002
 */

import { APIGatewayProxyEvent } from "aws-lambda";
import { DynamoDBClient, GetItemCommand, PutItemCommand, ScanCommand, UpdateItemCommand } from "@aws-sdk/client-dynamodb";
import { BidRecord, Item, User } from "auction-shared/models";
import { createLambdaResponse, AuthorizationFail, BadRequest, InternalError, uuid } from "@/src/services/auction/utils";
import { marshall, unmarshall } from "@aws-sdk/util-dynamodb";
import { ApiRequestParams, ApiResponseList } from "auction-shared/api";
import { AttributeMap } from "aws-sdk/clients/dynamodb";

const dbClient = new DynamoDBClient({});
const DB_ITEMS_TABLE = process.env.DB_ITEMS_TABLE;
const DB_USERS_TABLE = process.env.DB_USERS_TABLE;
const DB_BIDS_TABLE = process.env.DB_BIDS_TABLE;

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

	const { itemId, bidAmount } = result;

	// Check if the item exists
	let item: Item;
	try {
		item = await getItem(itemId);
	} catch (err) {
		const error = new InternalError("I001", err.message);
		return error.getResponse();
	}

	if (!item) {
		const error = new BadRequest("B006", "Item not found");
		return error.getResponse();
	}

	if (item.status === "completed") {
		const error = new BadRequest("B007", "auction is completed");
		return error.getResponse();
	}

	if (item.createdBy === userId) {
		const error = new BadRequest("B008", "You cannot bid your own item");
		return error.getResponse();
	}

	const userBalance = user.balance;

	// Check user balance against bidAmount
	if (userBalance < bidAmount) {
		const error = new BadRequest("B009", "Insufficient balance to bid the item");
		return error.getResponse();
	}

	let totalBidAmount;
	try {
		totalBidAmount = await getTotalBidAmountByUserAndItem(userId, itemId);
		totalBidAmount += bidAmount;
	} catch (err) {
		const error = new InternalError("I002", err.message);
		return error.getResponse();
	}

	// Get the current highest bid
	const currentHighestBid = item.highestBid ? item.highestBid : item.startingPrice;

	// Check if the bid amount is higher than the current highest bid
	if (totalBidAmount <= currentHighestBid) {
		const error = new BadRequest("B010", "Bid amount should be higher than the current highest bid");
		return error.getResponse();
	}

	// Check if enough time has passed since the last bid
	if (await hasEnoughTimePassedSinceLastBid(item, userId, 5)) {
		const error = new BadRequest("B011", "Please wait at least 5 seconds between bids");
		return error.getResponse();
	}

	// update the user balance
	try {
		await updateUserBalance(userId, userBalance - bidAmount);
	} catch (err) {
		const error = new InternalError("I003", err.message);
		return error.getResponse();
	}

	// Update the item with the new bid
	const updatedItem: Item = {
		...item,
		highestBid: totalBidAmount,
		lastBidTimestamp: Date.now(),
		highestBidder: userId
	};

	try {
		await dbClient.send(new UpdateItemCommand({
			TableName: DB_ITEMS_TABLE,
			Key: marshall({ itemId: itemId }),
			UpdateExpression: "SET #highestBid = :highestBid, #lastBidTimestamp = :lastBidTimestamp, #highestBidder = :highestBidder",
			ExpressionAttributeNames: {
				"#highestBid": "highestBid",
				"#lastBidTimestamp": "lastBidTimestamp",
				"#highestBidder": "highestBidder"
			},
			ExpressionAttributeValues: marshall({
				":highestBid": updatedItem.highestBid,
				":lastBidTimestamp": updatedItem.lastBidTimestamp,
				":highestBidder": updatedItem.highestBidder
			})
		}));
	} catch (err) {
		const error = new InternalError("I004", err.message);
		return error.getResponse();
	}

	const bidRecord: BidRecord = {
		bidId: uuid("bid"),
		itemId: itemId,
		bidderId: userId,
		amount: bidAmount,
		status: "pending",
		timestamp: Date.now(),
	};

	try {
		await storeBidRecord(bidRecord);
	} catch (err) {
		const error = new InternalError("I005", err.message);
		return error.getResponse();
	}

	return createLambdaResponse<ApiResponseList["bid-item"]>(200, {
		timestamp: Date.now(),
		data: updatedItem
	});
};

function parseInputParameter(event: APIGatewayProxyEvent): BadRequest | ApiRequestParams["bid-item"] {
	if (!event.body) {
		return new BadRequest("B001", "Input parameter is required");
	}

	const input = JSON.parse(event.body) as ApiRequestParams["bid-item"];

	if (!input.itemId) {
		return new BadRequest("B002", "itemId is required");
	}

	if (!input.bidAmount) {
		return new BadRequest("B003", "bidAmount is required");
	}

	if (isNaN(input.bidAmount)) {
		return new BadRequest("B004", "bidAmount must be a number");
	}

	if (input.bidAmount <= 0) {
		return new BadRequest("B005", "bidAmount must be greater than 0");
	}

	return input;
}


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
}

async function updateUserBalance(userId: string, newBalance: number): Promise<void> {
	await dbClient.send(new UpdateItemCommand({
		TableName: DB_USERS_TABLE,
		Key: {
			id: { S: userId }
		},
		UpdateExpression: "SET #balance = :newBalance",
		ExpressionAttributeNames: {
			"#balance": "balance"
		},
		ExpressionAttributeValues: {
			":newBalance": { N: newBalance.toString() }
		}
	}));
}

async function storeBidRecord(bidRecord: BidRecord): Promise<void> {
	await dbClient.send(
		new PutItemCommand({
			TableName: DB_BIDS_TABLE,
			Item: marshall(bidRecord),
		})
	);
}

async function getTotalBidAmountByUserAndItem(userId: string, itemId: string): Promise<number> {
	const queryResponse = await dbClient.send(new ScanCommand({
		TableName: DB_BIDS_TABLE,
		FilterExpression: "itemId = :itemId AND bidderId = :bidderId",
		ExpressionAttributeValues: marshall({
			":itemId": itemId,
			":bidderId": userId
		})
	}));

	let totalBidAmount = 0;
	if (queryResponse.Items && queryResponse.Items.length > 0) {
		totalBidAmount = queryResponse.Items.reduce((total: number, item: AttributeMap) => {
			return total + Number(item.amount.N);
		}, 0);
	}

	return totalBidAmount;
}

// Check if enough time has passed since the last bid by user id and item id
async function hasEnoughTimePassedSinceLastBid(item: Item, userId: string, seconds: number): Promise<boolean> {
	// query the bid records table that the timestamp is greater than the current time minus the seconds
	const queryResponse = await dbClient.send(new ScanCommand({
		TableName: DB_BIDS_TABLE,
		FilterExpression: "itemId = :itemId AND bidderId = :bidderId AND #timestamp > :timestamp",
		ExpressionAttributeNames: {
			"#timestamp": "timestamp"
		},
		ExpressionAttributeValues: marshall({
			":itemId": item.itemId,
			":bidderId": userId,
			":timestamp": Date.now() - seconds * 1000
		})
	}));

	return queryResponse.Items && queryResponse.Items.length > 0;
}
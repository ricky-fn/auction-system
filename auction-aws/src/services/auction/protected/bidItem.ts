/**
 * v0.1.0
 * Allows user to bid an item, the price must be higher than current highest price
 * 
 * @example
 * {
 *   "itemId": "item-1684722365121-4242",
 *   "bidAmount": 300
 * }
 * 
 * Errors:
 * Bad Request: B001, B002, B003, B004, B005, B006, B007, B008, B009, B010
 * Internal Error: I001, I002, I003, I004, I005, I006
 * Authorization Fail: A001
 */

import { APIGatewayProxyEvent } from "aws-lambda";
import { DynamoDBClient, GetItemCommand, PutItemCommand, ScanCommand, UpdateItemCommand } from "@aws-sdk/client-dynamodb";
import { BidRecord, Item, User } from "auction-shared/models";
import { createLambdaResponse, AuthorizationFail, BadRequest, InternalError, uuid } from "@/src/services/auction/utils";
import { marshall, unmarshall } from "@aws-sdk/util-dynamodb";
import { ApiList } from "auction-shared/api";
import { AttributeMap } from "aws-sdk/clients/dynamodb";

const dbClient = new DynamoDBClient({});
const DB_ITEMS_TABLE = process.env.DB_ITEMS_TABLE;
const DB_USERS_TABLE = process.env.DB_USERS_TABLE;
const DB_BID_RECORDS_TABLE = process.env.DB_BID_RECORDS_TABLE;

export type BidItemInputParameters = {
	itemId: string;
	bidAmount: number;
}

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

	const { itemId, bidAmount } = result;

	// Check if the item exists
	let item;
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

	let userBalance;
	try {
		const user = await getUserByUsername(userId);
		userBalance = user.balance;
	} catch (err) {
		const error = new InternalError("I002", err.message);
		return error.getResponse();
	}

	// Check user balance against bidAmount
	if (userBalance < bidAmount) {
		const error = new BadRequest("B008", "Insufficient balance to bid the item");
		return error.getResponse();
	}

	let totalBidAmount;
	try {
		totalBidAmount = await getTotalBidAmountByUserAndItem(userId, itemId);
		totalBidAmount += bidAmount;
	} catch (err) {
		const error = new InternalError("I003", err.message);
		return error.getResponse();
	}

	// Get the current highest bid
	const currentHighestBid = item.highestBid ? item.highestBid : item.startingPrice;

	// Check if the bid amount is higher than the current highest bid
	if (totalBidAmount <= currentHighestBid) {
		const error = new BadRequest("B009", "Bid amount should be higher than the current highest bid");
		return error.getResponse();
	}

	// Check if enough time has passed since the last bid
	const lastBidTimestamp = item.lastBidTimestamp ? item.lastBidTimestamp : 0;
	const currentTimestamp = Math.floor(Date.now() / 1000);
	const timeElapsed = currentTimestamp - lastBidTimestamp;
	const minimumTimeElapsed = 5; // Minimum time (in seconds) required between bids

	if (timeElapsed < minimumTimeElapsed) {
		const error = new BadRequest("B010", `Please wait at least ${minimumTimeElapsed} seconds between bids`);
		return error.getResponse();
	}

	// update the user balance
	try {
		await updateUserBalance(userId, userBalance - bidAmount);
	} catch (err) {
		const error = new InternalError("I004", err.message);
		return error.getResponse();
	}

	// Update the item with the new bid
	const updatedItem: Item = {
		...item,
		highestBid: totalBidAmount,
		lastBidTimestamp: currentTimestamp,
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
		const error = new InternalError("I005", err.message);
		return error.getResponse();
	}

	const bidRecord: BidRecord = {
		bidId: uuid("bid"),
		itemId: itemId,
		bidderId: userId,
		amount: bidAmount,
		status: "pending",
		timestamp: currentTimestamp,
	};

	try {
		await storeBidRecord(bidRecord);
	} catch (err) {
		const error = new InternalError("I006", err.message);
		return error.getResponse();
	}

	return createLambdaResponse<ApiList["bid-item"]>(200, {
		timestamp: Date.now(),
		data: updatedItem
	});
};

function parseInputParameter(event: APIGatewayProxyEvent): BadRequest | BidItemInputParameters {
	if (!event.body) {
		return new BadRequest("B001", "Input parameter is required");
	}

	const input = JSON.parse(event.body) as BidItemInputParameters;

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
			TableName: DB_BID_RECORDS_TABLE,
			Item: marshall(bidRecord),
		})
	);
}

async function getTotalBidAmountByUserAndItem(userId: string, itemId: string): Promise<number> {
	const queryResponse = await dbClient.send(new ScanCommand({
		TableName: DB_BID_RECORDS_TABLE,
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
/**
 * Allows user to bid an item, the price must be higher than current highest price
 * 
 * @example
 * {
 *   "itemId": "item-1684722365121-4242",
 *   "bidAmount": 300
 * }
 * 
 * Errors:
 * Bad Request: B001, B002, B003, B004, B005, B006, B007, B008, B009
 * Internal Error: I001, I002, I003, I004, I005
 * Authorization Fail: A001
 */

import { APIGatewayEventRequestContext, APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { DynamoDB } from "aws-sdk";
import { lambdaErrorHelper } from "../utils";
import { Item, LambdaResponse, User } from "../../../../types";
import { createLambdaResponse } from "../utils/helpers";

const dynamodb = new DynamoDB();
const DB_SESSIONS_TABLE = "Sessions";
const DB_ITEMS_TABLE = "Items";
const DB_USERS_TABLE = "Users";

const SECRET_KEY = "Jitera";

type BidItemOutput = {
	item: Item
}

export const handler = async (event: APIGatewayProxyEvent, context: APIGatewayEventRequestContext): Promise<LambdaResponse<BidItemOutput>> => {
	const error = validateInputParameters(event, context);
	if (error) {
		return error;
	}

	const { itemId, bidAmount } = JSON.parse(event.body || "{}");

	// Get the session token from the Authorization header
	const sessionToken = event.headers.Authorization ? event.headers.Authorization.split(" ")[1] : null; // Assuming the session token is sent in the Authorization header as a Bearer token

	if (!sessionToken) {
		return lambdaErrorHelper.handleAuthorizationFail("A001", "session token is required", context);
	}

	// Verify the session token and retrieve the associated userId
	let userId;
	try {
		userId = await verifySessionToken(sessionToken);
	} catch (err) {
		return lambdaErrorHelper.handleInternalError("I001", err, context);
	}

	let userBalance;
	try {
		userBalance = await getUserBalance(userId);
	} catch (err) {
		return lambdaErrorHelper.handleInternalError("I005", err, context);
	}

	// Check user balance against bidAmount
	if (userBalance < bidAmount) {
		return lambdaErrorHelper.handleBadRequest("B009", "Insufficient balance to create the item", context);
	}

	// Check if the item exists
	let item;
	try {
		item = await getItem(itemId);
	} catch (err) {
		return lambdaErrorHelper.handleInternalError("I002", err, context);
	}

	if (!item) {
		return lambdaErrorHelper.handleBadRequest("B006", "Item not found", context);
	}

	// Get the current highest bid
	const currentHighestBid = item.highestBid ? item.highestBid : item.startingPrice;

	// Check if the bid amount is higher than the current highest bid
	if (bidAmount <= currentHighestBid) {
		return lambdaErrorHelper.handleBadRequest("B007", "Bid amount should be higher than the current highest bid", context);
	}

	// Check if enough time has passed since the last bid
	const lastBidTimestamp = item.lastBidTimestamp ? item.lastBidTimestamp : 0;
	const currentTimestamp = Math.floor(Date.now() / 1000);
	const timeElapsed = currentTimestamp - lastBidTimestamp;
	const minimumTimeElapsed = 5; // Minimum time (in seconds) required between bids

	if (timeElapsed < minimumTimeElapsed) {
		return lambdaErrorHelper.handleBadRequest("B008", `Please wait at least ${minimumTimeElapsed} seconds between bids`, context);
	}

	// Update the item with the new bid
	try {
		await updateItem(itemId, userId, bidAmount, currentTimestamp);
	} catch (err) {
		lambdaErrorHelper.handleInternalError("I003", err, context);
	}

	try {
		item = await getItem(itemId);
	} catch (err) {
		return lambdaErrorHelper.handleInternalError("I004", err, context);
	}

	return createLambdaResponse<BidItemOutput>(200, { item });
};

const validateInputParameters = (event: APIGatewayProxyEvent, context: APIGatewayEventRequestContext): APIGatewayProxyResult | void => {
	if (!event.body) {
		return lambdaErrorHelper.handleBadRequest("B001", "Input parameter is required", context);
	}

	const input = JSON.parse(event.body);

	if (!input.itemId) {
		return lambdaErrorHelper.handleBadRequest("B002", "itemId is required", context);
	}

	if (!input.bidAmount) {
		return lambdaErrorHelper.handleBadRequest("B003", "bidAmount is required", context);
	}

	if (isNaN(input.bidAmount)) {
		return lambdaErrorHelper.handleBadRequest("B004", "bidAmount must be a number", context);
	}

	if (input.bidAmount <= 0) {
		return lambdaErrorHelper.handleBadRequest("B005", "bidAmount must be greater than 0", context);
	}
};

// Function to verify the session token
const verifySessionToken = (sessionToken: string): Promise<string> => {
	return new Promise<string>((resolve, reject) => {
		jwt.verify(sessionToken, SECRET_KEY, (error, decoded) => {
			if (error) {
				return reject(error);
			}

			const payload = decoded as JwtPayload;

			if (!payload || !payload.exp) {
				return reject("Invalid JWT token");
			}

			const currentTime = Math.floor(Date.now() / 1000); // Convert to seconds

			if (payload.exp < currentTime) {
				return reject("Session token has expired");
			}

			// Retrieve the userId associated with the session from the Sessions table
			dynamodb.getItem({
				TableName: DB_SESSIONS_TABLE,
				Key: { sessionId: { S: sessionToken } }
			}, (err, data) => {
				if (err) {
					console.error("Error retrieving session from Sessions table: ", err);
					reject(err);
				} else {
					const user = AWS.DynamoDB.Converter.unmarshall(data.Item as AWS.DynamoDB.AttributeMap) as User;
					resolve(user.userId);
				}
			});
		});
	});
};

// Function to retrieve an item by itemId
const getItem = (itemId: string): Promise<Item> => {
	return dynamodb
		.getItem({
			TableName: DB_ITEMS_TABLE,
			Key: {
				itemId: { S: itemId }
			}
		})
		.promise()
		.then((data) => {
			if (!data || !data.Item) {
				throw new Error("Item not found");

			}
			return AWS.DynamoDB.Converter.unmarshall(data.Item) as Item;
		});
};

// Function to retrieve the user balance from the database
const getUserBalance = (userId: string): Promise<number> => {
	return new Promise((resolve, reject) => {
		const params = {
			TableName: DB_USERS_TABLE,
			Key: {
				userId: { S: userId },
			},
			ProjectionExpression: "balance"
		};

		dynamodb.getItem(params, (err, data) => {
			if (err) {
				console.error("Error retrieving user balance from the database: ", err);
				reject(err);
			} else {
				if (!data.Item || !data.Item.balance || !data.Item.balance.N) {
					console.error("User balance not found");
					return reject("User balance not found");
				}

				const user = AWS.DynamoDB.Converter.unmarshall(data.Item) as User;

				const userBalance = user.balance;
				resolve(userBalance);
			}
		});
	});
};

// Function to update an item with a new bid
const updateItem = (itemId: string, userId: string, bidAmount: number, currentTimestamp: number): Promise<unknown> => {
	return dynamodb
		.updateItem({
			TableName: DB_ITEMS_TABLE,
			Key: {
				itemId: { S: itemId }
			},
			UpdateExpression: "SET highestBid = :bidAmount, highestBidder = :userId, lastBidTimestamp = :currentTimestamp",
			ExpressionAttributeValues: {
				":bidAmount": { N: bidAmount.toString() },
				":userId": { S: userId },
				":currentTimestamp": { N: currentTimestamp.toString() }
			}
		})
		.promise();
};
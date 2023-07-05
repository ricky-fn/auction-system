/**
 * v 0.1.0
 * Check the status of the items and refund the users if the item is completed
 * 
 * Errors:
 * Internal Error: I001, I002, I003, I004, I005, I006, I007, I008
 */

import { InternalError } from "@/src/services/auction/utils";
import { BidRecord, Item, ItemStatus, Items, User } from "auction-shared/models";
import { BatchGetItemCommand, BatchWriteItemCommand, DynamoDBClient, ScanCommand } from "@aws-sdk/client-dynamodb";
import { marshall, unmarshall } from "@aws-sdk/util-dynamodb";

const dbClient = new DynamoDBClient({});
const DB_ITEMS_TABLE = process.env.DB_ITEMS_TABLE as string;
const DB_BIDS_TABLE = process.env.DB_BIDS_TABLE as string;
const DB_USERS_TABLE = process.env.DB_USERS_TABLE as string;

export const handler = async () => {
	// Retrieve all items from the Items table
	let itemsDBData;
	try {
		itemsDBData = await dbClient.send(
			new ScanCommand({
				TableName: DB_ITEMS_TABLE,
				FilterExpression: "#status = :statusValue",
				ExpressionAttributeNames: {
					"#status": "status",
				},
				ExpressionAttributeValues: {
					":statusValue": {
						S: "ongoing" as ItemStatus,
					},
				},
			})
		);
	} catch (err) {
		const error = new InternalError("I001", err.message);
		return error.getResponse();
	}

	if (itemsDBData.Items.length === 0) {
		return;
	}

	const items: Items = itemsDBData.Items.map((item) => {
		return unmarshall(item) as Item;
	});

	// Filter out the items that are completed
	const completedItems = items.filter((item) => {
		const match = item.expirationTime.match(/^(\d+)h$/);
		if (!match) {
			return false;
		} else {
			const hours = parseInt(match[1]);
			const seconds = hours * 3600;
			const now = Math.floor(Date.now() / 1000);
			const expirationTime = item.createdAt + seconds;
			return now > expirationTime;
		}
	}).map((item) => {
		return {
			...item,
			status: "completed",
		} as Item;
	});

	// If there is no completed auction, end the function
	if (completedItems.length === 0) {
		return;
	}

	// For each completed item, retrieve the highest bidder and refund the other bidders
	for (const item of completedItems) {
		const highestBidder = item.highestBidder;

		// Refund the other bidders
		const refundResult = await refundUsers(item.itemId, highestBidder);

		if (refundResult instanceof InternalError) {
			return refundResult;
		}
	}

	// Use dynamodb.batchWrite to update the status of the items
	const batchRequests = completedItems.map((item) => {
		return {
			PutRequest: {
				Item: marshall(item),
			},
		};
	});

	try {
		await dbClient.send(
			new BatchWriteItemCommand({
				RequestItems: {
					[DB_ITEMS_TABLE]: batchRequests,
				},
			})
		);

		// console log the item ids
		console.log(`${completedItems.length} items are completed:`, completedItems.map((item) => item.itemId));
	} catch (err) {
		const error = new InternalError("I002", err.message);
		return error.getResponse();
	}
};

// scan the bid records table to refund the users except the highest bidder
async function refundUsers(itemId: string, highestBidder: string): Promise<void | InternalError> {
	const bidsResult = await retrieveBidRecords(itemId);

	if (bidsResult instanceof InternalError) {
		return bidsResult;
	}

	const bids = bidsResult;
	if (bids.length === 0) {
		return;
	}

	const bidsExceptHighestBidder = bids.filter((bid) => bid.bidderId !== highestBidder);

	// retrieve the users' balance and sum up the total amount to refund
	const usersResult = await retrieveUsers(bidsExceptHighestBidder);

	if (usersResult instanceof InternalError) {
		return usersResult;
	}

	const usersDBData = usersResult;

	// Use dynamodb.batchWrite to update the users' balance
	const usersBatchRequests = usersDBData.map((user) => {
		// count the total amount to refund
		const refund = bidsExceptHighestBidder.filter((bid) => bid.bidderId === user.id).reduce((acc, bid) => acc + bid.amount, 0);
		return {
			PutRequest: {
				Item: marshall({
					...user,
					balance: user.balance + refund,
				}),
			},
		};
	});

	try {
		await dbClient.send(
			new BatchWriteItemCommand({
				RequestItems: {
					[DB_USERS_TABLE]: usersBatchRequests,
				},
			})
		);
	} catch (err) {
		const error = new InternalError("I004", err.message);
		return error;
	}

	// change the status of the highest bidder's bid record to "completed"
	const highestBidderBidRecord = bids.filter((bid) => bid.bidderId === highestBidder);
	const highestBidderBidRecordUpdateRequest = highestBidderBidRecord.map((bid) => {
		const item: BidRecord = {
			...bid,
			status: "completed",
		};
		return {
			PutRequest: {
				Item: marshall(item),
			},
		};
	});

	try {
		await dbClient.send(
			new BatchWriteItemCommand({
				RequestItems: {
					[DB_BIDS_TABLE]: highestBidderBidRecordUpdateRequest,
				},
			})
		);
	} catch (err) {
		const error = new InternalError("I005", err.message);
		return error;
	}

	// Use dynamodb.batchWrite to refund the users
	const refundBatchRequests = bidsExceptHighestBidder.map((bid) => {
		const item: BidRecord = {
			...bid,
			status: "refunded",
		};

		return {
			PutRequest: {
				Item: marshall(item),
			},
		};
	});

	try {
		await dbClient.send(
			new BatchWriteItemCommand({
				RequestItems: {
					[DB_BIDS_TABLE]: refundBatchRequests,
				},
			})
		);

		// console log the item ids
		console.log(`${bidsExceptHighestBidder.length} bids are refunded:`, bidsExceptHighestBidder.map((bid) => bid.bidId));
	} catch (err) {
		const error = new InternalError("I006", err.message);
		return error;
	}
}

async function retrieveBidRecords(itemId: string): Promise<BidRecord[] | InternalError> {
	let bidsDBData, bids;
	try {
		// retrieve all bid records and unmashall them
		bidsDBData = await dbClient.send(
			new ScanCommand({
				TableName: DB_BIDS_TABLE,
				FilterExpression: "#itemId = :itemIdValue",
				ExpressionAttributeNames: {
					"#itemId": "itemId",
				},
				ExpressionAttributeValues: {
					":itemIdValue": {
						S: itemId,
					},
				},
			})
		);
		bids = bidsDBData.Items.map((item) => {
			return unmarshall(item) as BidRecord;
		});
	} catch (err) {
		return new InternalError("I007", err.message);
	}
	return bids;
}

async function retrieveUsers(bids: BidRecord[]): Promise<User[] | InternalError> {
	const userIds = bids.map((bid) => bid.bidderId);

	let usersDBData;
	try {
		// retrieve all bid records and unmashall them
		usersDBData = await dbClient.send(
			new BatchGetItemCommand({
				RequestItems: {
					[DB_USERS_TABLE]: {
						Keys: userIds.reduce((acc, userId) => {
							if (acc.find((user) => user.id.S === userId)) {
								return acc;
							}

							acc.push({
								id: {
									S: userId,
								},
							});
							return acc;
						}, []),
					},
				},
			})
		);
	} catch (err) {
		return new InternalError("I008", err.message);
	}

	const users: User[] = usersDBData.Responses![DB_USERS_TABLE].map((user) => {
		return unmarshall(user) as User;
	});

	return users;
}
/**
 * Retrieve all items from the Items table
 * 
 * Errors:
 * Internal Error: I001, I002
 */

import { DynamoDB } from "aws-sdk";
import { InternalError } from "@/src/services/auction/utils";
import { Item, Items } from "auction-shared/models";

const dynamodb = new DynamoDB();
const DB_ITEMS_TABLE = process.env.DB_ITEMS_TABLE as string;

export const handler = async () => {
	// Retrieve all items from the Items table
	let itemsDBData;
	try {
		itemsDBData = await dynamodb
			.scan({
				TableName: DB_ITEMS_TABLE,
				FilterExpression: "#status = :statusValue",
				ExpressionAttributeNames: {
					"#status": "status",
				},
				ExpressionAttributeValues: {
					":statusValue": {
						S: "ongoing",
					},
				},
			})
			.promise();
	} catch (err) {
		const error = new InternalError("I001", err.message);
		return error.getResponse();
	}

	if (itemsDBData.Items.length === 0) {
		return;
	}

	const items: Items = itemsDBData.Items.map((item: DynamoDB.AttributeMap) => {
		return DynamoDB.Converter.unmarshall(item) as Item;
	});

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
		};
	});

	// Use dynamodb.batchWrite to update the status of the items
	const batchRequests = completedItems.map((item) => {
		return {
			PutRequest: {
				Item: DynamoDB.Converter.marshall(item),
			},
		};
	});

	try {
		await dynamodb
			.batchWriteItem({
				RequestItems: {
					[DB_ITEMS_TABLE]: batchRequests,
				},
			})
			.promise();

		// console log the item ids
		console.log(`${completedItems.length} items are completed:`, completedItems.map((item) => item.itemId));
	} catch (err) {
		const error = new InternalError("I002", err.message);
		return error.getResponse();
	}
};
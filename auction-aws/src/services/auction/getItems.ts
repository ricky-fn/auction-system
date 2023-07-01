/**
 * Retrieve all items from the Items table
 * 
 * Errors:
 * Internal Error: I001, I002
 */

import { DynamoDB } from "aws-sdk";
import { createLambdaResponse, InternalError } from "@/src/services/auction/utils";
import { Item, Items } from "auction-shared/models";
import { ApiList } from "auction-shared/api";

const dynamodb = new DynamoDB();
const DB_ITEMS_TABLE = process.env.DB_ITEMS_TABLE as string;

export const handler = async () => {
	// Retrieve all items from the Items table
	let itemsDBData;
	try {
		itemsDBData = await dynamodb
			.scan({
				TableName: DB_ITEMS_TABLE
			})
			.promise();
	} catch (err) {
		const error = new InternalError("I001", err.message);
		return error.getResponse();
	}

	if (!itemsDBData.Items) {
		const error = new InternalError("I002", "Fetch items failed");
		return error.getResponse();
	}

	const items: Items = itemsDBData.Items.map((item: DynamoDB.AttributeMap) => {
		return DynamoDB.Converter.unmarshall(item) as Item;
	});

	return createLambdaResponse<ApiList["get-items"]>(200, {
		timestamp: Date.now(),
		data: items
	});
};
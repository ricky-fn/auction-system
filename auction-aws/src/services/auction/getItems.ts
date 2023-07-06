/**
 * v 0.1.0
 * Retrieve all items from the Items table
 * 
 * Errors:
 * Internal Error: I001
 */

import { DynamoDB } from "aws-sdk";
import { createLambdaResponse, InternalError } from "@/src/services/auction/utils";
import { Item, Items } from "auction-shared/models";
import { ApiResponseList } from "auction-shared/api";
import { DynamoDBClient, ScanCommand } from "@aws-sdk/client-dynamodb";

const dbClient = new DynamoDBClient({});
const DB_ITEMS_TABLE = process.env.DB_ITEMS_TABLE as string;

export const handler = async () => {
	// Retrieve all items from the Items table
	let itemsDBData;
	try {
		itemsDBData = await dbClient.send(new ScanCommand({
			TableName: DB_ITEMS_TABLE
		}));
	} catch (err) {
		const error = new InternalError("I001", err.message);
		return error.getResponse();
	}

	const items: Items = itemsDBData.Items.map((item: DynamoDB.AttributeMap) => {
		return DynamoDB.Converter.unmarshall(item) as Item;
	});

	return createLambdaResponse<ApiResponseList["get-items"]>(200, {
		timestamp: Date.now(),
		data: items
	});
};
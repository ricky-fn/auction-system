/**
 * v 0.1.0
 * Retrieve all items from the Items table
 * 
 * Errors:
 * Internal Error: I001
 */

import { BadRequest, createLambdaResponse, InternalError } from "@/src/services/auction/utils";
import { Item, Items } from "auction-shared/models";
import { ApiResponseList, ApiRequestParams } from "auction-shared/api";
import { DynamoDBClient, GetItemCommand, ScanCommand } from "@aws-sdk/client-dynamodb";
import { APIGatewayProxyEvent } from "aws-lambda";
import { unmarshall } from "@aws-sdk/util-dynamodb";

const dbClient = new DynamoDBClient({});
const DB_ITEMS_TABLE = process.env.DB_ITEMS_TABLE as string;

export const handler = async (event: APIGatewayProxyEvent) => {
	const result = parseInputParameter(event);

	if (result instanceof BadRequest) {
		return result.getResponse();
	}

	let item: Item;
	try {
		item = await getItem(result.itemId);
	} catch (err) {
		const error = new InternalError("I001", err.message);
		return error.getResponse();
	}

	if (!item) {
		const error = new BadRequest("B003", "Item not found");
		return error.getResponse();
	}

	return createLambdaResponse<ApiResponseList["get-item-by-id"]>(200, {
		timestamp: Date.now(),
		data: item
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
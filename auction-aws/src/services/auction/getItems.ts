/**
 * Retrieve all items from the Items table
 * 
 * Errors:
 * Internal Error: I001, I002
 */

import { APIGatewayEventRequestContext, APIGatewayProxyEvent } from "aws-lambda";
import { DynamoDB } from "aws-sdk";
import { lambdaErrorHelper, createLambdaResponse } from "./utils";
import { Item, Items, LambdaResponse } from "../../../types";

const dynamodb = new DynamoDB();
const DB_ITEMS_TABLE = process.env.DB_ITEMS_TABLE as string;

type GetItemsOutput = {
	items: Items
}

export const handler = async (event: APIGatewayProxyEvent, context: APIGatewayEventRequestContext): Promise<LambdaResponse<GetItemsOutput>> => {
	// Retrieve all items from the Items table
	let itemsDBData;
	try {
		itemsDBData = await dynamodb
			.scan({
				TableName: DB_ITEMS_TABLE
			})
			.promise();
	} catch (err) {
		return lambdaErrorHelper.handleInternalError("I001", err, context);
	}

	if (!itemsDBData.Items) {
		return lambdaErrorHelper.handleInternalError("I002", "Fetch items failed", context);
	}

	const items: Items = itemsDBData.Items.map((item: DynamoDB.AttributeMap) => {
		return DynamoDB.Converter.unmarshall(item) as Item;
	});

	return createLambdaResponse<GetItemsOutput>(200, {
		items
	});
};
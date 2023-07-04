/**
 * Deposit Lambda function
 * 
 * @example
 * {
 *   "name": "Example Item",
 *   "startingPrice": 100,
 *   "timeWindow": 3600
 * }
 * 
 * Errors:
 * Bad Request: B001, B002, B003, B004
 * Internal Error: I001, I002, I003
 * Authorization Fail: A001
 */


import { DynamoDBClient, GetItemCommand, UpdateItemCommand } from "@aws-sdk/client-dynamodb";
import { APIGatewayProxyEvent } from "aws-lambda";
import { AuthorizationFail, BadRequest, InternalError, createLambdaResponse } from "../utils";
import { User } from "auction-shared/models";
import { unmarshall } from "@aws-sdk/util-dynamodb";
import { ApiList } from "auction-shared/api";

const dbClient = new DynamoDBClient({});
const DB_USERS_TABLE = process.env.DB_USERS_TABLE;

export interface DepositInputParameters {
	amount: number;
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

	const balance = user.balance;
	const newBalance = balance + Number(result.amount);

	// Update the user's balance in the Users table
	try {
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
	} catch (err) {
		const error = new InternalError("I002", err.message);
		return error.getResponse();
	}

	return createLambdaResponse<ApiList["deposit"]>(200, {
		timestamp: Date.now()
	});
};

const parseInputParameter = (event: APIGatewayProxyEvent): BadRequest | DepositInputParameters => {
	if (!event.body) {
		return new BadRequest("B001", "Input parameter is required");
	}

	const input = JSON.parse(event.body) as DepositInputParameters;

	if (!input.amount) {
		return new BadRequest("B002", "amount is required");
	}

	if (isNaN(input.amount)) {
		return new BadRequest("B003", "amount must be a number");
	}

	if (input.amount <= 0) {
		return new BadRequest("B004", "amount must be greater than 0");
	}

	return input;
};

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
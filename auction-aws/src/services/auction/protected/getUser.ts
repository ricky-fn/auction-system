import { DynamoDB } from "aws-sdk";
/**
 * Registration function
 * 
 * @example
 * {
 *   "username": "ducky.test@gmail.com",
 *   "password": "abc123123111"
 * }
 * 
 * Errors:
 * Bad Request: B001
 * Internal Error: I001, I002
 */
import { DynamoDBClient, GetItemCommand, PutItemCommand } from "@aws-sdk/client-dynamodb";
import { marshall, unmarshall } from "@aws-sdk/util-dynamodb";
import { User } from "../../../../types";
import { APIGatewayProxyEvent } from "aws-lambda";

const dbClient = new DynamoDBClient({});
const DB_USERS_TABLE = process.env.DB_USERS_TABLE;

export async function handler(event: APIGatewayProxyEvent) {
	console.log("getUser Event for test: ", event);

	return {
		statusCode: 200,
		body: JSON.stringify({
			message: "Hello World!",
		})
	};
}

// Function to retrieve user by username from DynamoDB
// async function getUserByUsername(userId: string): Promise<User | undefined> {
// 	// Create the parameters for the DynamoDB query

// 	const getItemResponse = await dbClient.send(new GetItemCommand({
// 		TableName: DB_USERS_TABLE,
// 		Key: {
// 			"id": { S: userId }
// 		}
// 	}));
// 	if (getItemResponse.Item) {
// 		const unmashalledItem = unmarshall(getItemResponse.Item) as User;
// 		return unmashalledItem;
// 	}
// 	return undefined;
// }

// // Function to store user in DynamoDB
// async function createUser(user: User) {
// 	const item = marshall(user);
// 	await dbClient.send(new PutItemCommand({
// 		TableName: DB_USERS_TABLE,
// 		Item: item
// 	}));
// }
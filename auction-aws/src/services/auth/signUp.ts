/**
 * v 0.1.0
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
import { Callback, Context, PreSignUpExternalProviderTriggerEvent, PreSignUpTriggerEvent } from "aws-lambda";
import { DynamoDBClient, GetItemCommand, PutItemCommand } from "@aws-sdk/client-dynamodb";
import { marshall, unmarshall } from "@aws-sdk/util-dynamodb";
import { User } from "auction-shared/models";

const dbClient = new DynamoDBClient({});
const DB_USERS_TABLE = process.env.DB_USERS_TABLE;

export async function handler(event: PreSignUpExternalProviderTriggerEvent, context: Context, callback: Callback) {
	console.log("SignUp Event for test: ", event);

	const user = createUserObject(event);

	let existingUser;
	try {
		existingUser = await getUserById(user.id);
	} catch (err) {
		err.message = "I001 Failed to fetch user. " + err.message;
		return callback(err, event);
	}

	if (event.triggerSource === "PreSignUp_ExternalProvider" && existingUser) {
		return callback("B001 User exist", event);
	}

	try {
		await createUser(user);
	} catch (err) {
		err.message = "I002 Failed to create user in database. " + err.message;
		return callback(err, event);
	}

	callback(null, event);
}

function createUserObject(event: PreSignUpTriggerEvent): User {
	let user;
	if (event.triggerSource === "PreSignUp_ExternalProvider") {
		const { email, given_name, family_name, picture } = event.request.userAttributes;
		const userId = event.userName;
		// Create the user object to be stored in DynamoDB
		user = {
			id: userId,
			create_at: new Date().getTime(),
			balance: 0,
			email,
			given_name,
			family_name,
			picture
		};
	}

	if (event.triggerSource === "PreSignUp_AdminCreateUser") {
		const userId = event.userName;
		// Create the user object to be stored in DynamoDB
		user = {
			id: userId,
			create_at: new Date().getTime(),
			balance: 0,
			given_name: userId,
		};
	}

	// if (event.triggerSource === "PreSignUp_SignUp") {
	// }

	return user;
}

// Function to retrieve user by username from DynamoDB
async function getUserById(userId: string): Promise<User | undefined> {
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

// Function to store user in DynamoDB
async function createUser(user: User) {
	const item = marshall(user);
	await dbClient.send(new PutItemCommand({
		TableName: DB_USERS_TABLE,
		Item: item,
	}));
}
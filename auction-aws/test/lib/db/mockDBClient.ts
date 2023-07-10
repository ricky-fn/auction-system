import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { mockClient } from "aws-sdk-client-mock";

const mockDBClient = mockClient(DynamoDBClient);

export default mockDBClient;
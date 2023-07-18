import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { mockClient } from "aws-sdk-client-mock";
import "aws-sdk-client-mock-jest";

const mockDBClient = mockClient(DynamoDBClient);

export default mockDBClient;
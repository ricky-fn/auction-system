import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from "aws-lambda";

export type LambdaHandler = (
  event: APIGatewayProxyEvent,
  context?: Context
) => Promise<APIGatewayProxyResult>;
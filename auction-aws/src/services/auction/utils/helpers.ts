import { APIGatewayProxyResult } from "aws-lambda";

export class Response {
	public statusCode = 200;
	public outputResponse(message: string): APIGatewayProxyResult {
		const data = {
			timestamp: Date.now(),
			error: message,
		};
		return createLambdaResponse(this.statusCode, JSON.stringify(data));
	}
}

export class BadRequest extends Response {
	public readonly statusCode = 400;
	constructor(public errorCode: string, public errorMessage: string) {
		super();
		console.error(`Bad Request [${errorCode}]: ${errorMessage}`);
	}
	public getResponse(): APIGatewayProxyResult {
		return this.outputResponse(`${this.errorCode} Bad Request`);
	}
}

export class InternalError extends Response {
	public statusCode = 500;
	constructor(public errorCode: string, public errorMessage: string) {
		super();
		console.error(`Internal Server Error [${errorCode}]: ${errorMessage}`);
	}
	public getResponse(): APIGatewayProxyResult {
		return this.outputResponse(`${this.errorCode} Internal Server Error`);
	}
}

export class AuthorizationFail extends Response {
	public statusCode = 401;
	constructor(public errorCode: string, public errorMessage: string) {
		super();
		console.error(`Authorization Failure [${errorCode}]: ${errorMessage}`);
	}
	public getResponse(): APIGatewayProxyResult {
		return this.outputResponse(`${this.errorCode} Authorization Failed`);
	}
}

export const createLambdaResponse = <T>(
	statusCode: number,
	data?: T
): APIGatewayProxyResult => {
	return {
		statusCode,
		headers: {
			"Access-Control-Allow-Origin": "*",
			"Content-Type": "application/json",
		},
		body: JSON.stringify(data),
	};
};
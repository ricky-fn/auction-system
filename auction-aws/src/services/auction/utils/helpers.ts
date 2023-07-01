import { APIGatewayProxyResult } from "aws-lambda";

export class Response {
	protected statusCode = 200;
	public outputResponse(message: string): APIGatewayProxyResult {
		return {
			statusCode: this.statusCode,
			headers: {
				"Access-Control-Allow-Origin": "*"
			},
			body: JSON.stringify({
				timestamp: Date.now(),
				error: message,
			}),
		};
	}
}

export class BadRequest extends Response {
	protected statusCode = 400;
	constructor(public errorCode: string, public errorMessage: string) {
		super();
		console.log(`Bad Request [${errorCode}]: ${errorMessage}`);
	}
	public getResponse(): APIGatewayProxyResult {
		return this.outputResponse(`${this.errorCode} Bad Request`);
	}
}

export class InternalError extends Response {
	protected statusCode = 500;
	constructor(public errorCode: string, public errorMessage: string) {
		super();
		console.log(`Internal Server Error [${errorCode}]: ${errorMessage}`);
	}
	public getResponse(): APIGatewayProxyResult {
		return this.outputResponse(`${this.errorCode} Internal Server Error`);
	}
}

export class AuthorizationFail extends Response {
	protected statusCode = 401;
	constructor(public errorCode: string, public errorMessage: string) {
		super();
		console.log(`Authorization Failure [${errorCode}]: ${errorMessage}`);
	}
	public getResponse(): APIGatewayProxyResult {
		return this.outputResponse(`${this.errorCode} Authorization failed`);
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
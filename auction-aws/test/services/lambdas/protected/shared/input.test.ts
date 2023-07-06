import { BadRequest } from "@/src/services/auction/utils";
import { LambdaHandler } from "@/test/types";

export const sharedInputTest = (handler: LambdaHandler, restOfTest?: () => void) => {
	it("should return a BadRequest when no body is provided", async () => {
		const { body: response, statusCode } = await handler({} as any);

		const error = new BadRequest("B001", "Input parameter is required");
		const { body: expectedResponse } = error.getResponse();

		expect(JSON.parse(response).error).toEqual(JSON.parse(expectedResponse).error);
		expect(statusCode).toEqual(error.statusCode);
	});

	if (restOfTest) {
		restOfTest();
	}
};
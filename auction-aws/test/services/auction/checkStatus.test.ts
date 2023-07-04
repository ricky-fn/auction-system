import { handler } from "@/src/services/auction/checkStatus";

async function testCheckStatusLambda() {
	const result = await handler();

	console.log(result);
}

testCheckStatusLambda();
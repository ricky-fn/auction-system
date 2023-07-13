import { handler } from "@/src/services/amplify/updateEnvVariables";

async function testUpdateEnv() {
	try {
		await handler({} as any);
	} catch (err) {
		console.log(err);
	}
}

testUpdateEnv();
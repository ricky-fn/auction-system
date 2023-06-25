import { ListBucketsCommand, S3Client } from "@aws-sdk/client-s3";
import { AuthService } from "../lib/auth";
import { AwsCredentialIdentity } from "@aws-sdk/types";

async function testAuth() {
	const service = new AuthService();
	const loginResult = await service.login(
		"ricky",
		"askjskfT7sdf&"
	);

	console.log(loginResult.getSignInUserSession().getIdToken().getJwtToken());

	// const credentials = await service.generateTemporaryCredentials(loginResult);
	// const buckets = await listBuckets(credentials);
	// console.log(buckets);
}

// async function listBuckets(credentials: AwsCredentialIdentity) {
// 	const client = new S3Client({
// 		credentials
// 	});

// 	const command = new ListBucketsCommand({});
// 	const result = await client.send(command);
// 	return result;
// }

testAuth();
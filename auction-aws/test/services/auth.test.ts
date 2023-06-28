import { handler } from "./../../src/services/auth/signUp";
import { CognitoUser } from "@aws-amplify/auth";
import { ListBucketsCommand, S3Client } from "@aws-sdk/client-s3";
import { AuthService } from "../lib/auth";
import { AwsCredentialIdentity } from "@aws-sdk/types";
import { Callback, Context, PreSignUpExternalProviderTriggerEvent } from "aws-lambda";

async function testAuth() {
	const service = new AuthService();
	const loginResult: CognitoUser = await service.login(
		"ricky",
		"askjskfT7sdf&"
	);

	console.log(loginResult.getSignInUserSession()!.getIdToken().getJwtToken());
}

async function testSignUp() {
	const event = {
		userName: "Google_108126319111382245486",
		request: {
			userAttributes: {
				email_verified: "true",
				nickname: "Ricky Jiang",
				given_name: "Ricky",
				family_name: "Jiang",
				email: "ricky.jc2022@gmail.com"
			},
			validationData: {}
		}
	};

	const callback: Callback = (err, data) => {
		console.log(err, data);
	};

	handler(event as any, {} as any, callback);
}

testAuth();
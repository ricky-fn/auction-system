import { Callback, Context, PreAuthenticationTriggerEvent, } from "aws-lambda";

export async function handler(event: PreAuthenticationTriggerEvent, context: Context, callback: Callback<PreAuthenticationTriggerEvent>) {
	console.log("SignIn Event for test: ", event);
	callback(null, event);
}
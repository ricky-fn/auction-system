import { CfnOutput, CfnOutputProps, Fn, Stack } from "aws-cdk-lib";
import { Construct } from "constructs";
import { IStackCfnOutputObject } from "../types";

export function getSuffixFromStack(stack: Stack) {
	const shortStackId = Fn.select(2, Fn.split("/", stack.stackId));
	const suffix = Fn.select(4, Fn.split("-", shortStackId));
	return suffix;
}

export function capitalizeFirstLetter(str) {
	return str.charAt(0).toUpperCase() + str.slice(1);
}

export function createEnvCfnOutputs(scope: Construct, id: string, props: CfnOutputProps): IStackCfnOutputObject {
	const output = new CfnOutput(scope, id, props);

	return {
		[id]: output,
	};
}

type NestedObject = {
	[key: string]: any;
};

export function flattenObject<T extends NestedObject>(obj: T): Record<string, any> {
	const flattenedObj: Record<string, any> = {};

	for (const key in obj) {
		if (typeof obj[key] === "object" && obj[key] !== null) {
			for (const nestedKey in obj[key]) {
				flattenedObj[nestedKey] = obj[key][nestedKey];
			}
		}
	}

	return flattenedObj;
}

export function convertObjectToString(obj: NestedObject): string {
	const convertedObj = {};

	for (const key in obj) {
		if (typeof obj[key] === "object" && obj[key] !== null) {
			const nestedObj = {};

			for (const nestedKey in obj[key]) {
				nestedObj[nestedKey] = `$${nestedKey}`;
			}

			convertedObj[key] = nestedObj;
		}
	}

	return JSON.stringify(convertedObj);
}
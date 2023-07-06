import { JestConfigWithTsJest } from "ts-jest";

const baseTestDir = "<rootDir>/test/services/lambdas";

const config: JestConfigWithTsJest = {
	preset: "ts-jest",
	testEnvironment: "node",
	testMatch: [`${baseTestDir}/**/*.test.ts`],
	moduleNameMapper: {
		"^@/(.*)$": "<rootDir>/$1",
		"^auction-shared/(.*)$": "../auction-shared/*"
	},
};

export default config;
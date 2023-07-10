import { JestConfigWithTsJest } from "ts-jest";

const baseTestDir = "<rootDir>/test/services";

const config: JestConfigWithTsJest = {
	preset: "ts-jest",
	testEnvironment: "node",
	testMatch: [`${baseTestDir}/**/*.test.ts`],
	moduleNameMapper: {
		"^@/(.*)$": "<rootDir>/$1",
		"^auction-shared/(.*)$": "<rootDir>/../auction-shared/$1",
	},
	setupFiles: ["./jest.setup.ts"],
};

export default config;
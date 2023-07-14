import { defineConfig } from "cypress";
import dotenvExtended from 'dotenv-extended';

dotenvExtended.load({
  path: '.env.test.local',
  defaults: '.env.test',
  overrideProcessEnv: true
});

export default defineConfig({
  env: { ...process.env },
  e2e: {
    baseUrl: process.env.BASE_URL,
  },
  component: {
    devServer: {
      framework: 'next',
      bundler: 'webpack',
    },
  },
});

import { defineConfig } from "cypress";
import dotenvExtended from 'dotenv-extended';

dotenvExtended.load({
  path: '.env.test.local',
  defaults: '.env.test',
  overrideProcessEnv: true
});

export default defineConfig({
  e2e: {
    env: process.env
  },
  component: {
    devServer: {
      framework: 'next',
      bundler: 'webpack',
    },
  },
});

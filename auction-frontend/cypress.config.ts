import { defineConfig } from "cypress";
import dotenvExtended from 'dotenv-extended';

dotenvExtended.load({
  path: '.env.test.local',
  defaults: '.env.test',
  silent: true,
});

export default defineConfig({
  e2e: {
    baseUrl: process.env.NEXTAUTH_URL,
    env: {
      NEXTAUTH_JWT_SECRET: process.env.NEXTAUTH_JWT_SECRET,
      BASE_URL: process.env.NEXTAUTH_URL,
      ENABLE_MOCKS: process.env.ENABLE_MOCKS
    }
  },
  component: {
    devServer: {
      framework: 'next',
      bundler: 'webpack',
    },
  },
});

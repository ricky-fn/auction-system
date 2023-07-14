import { defineConfig } from "cypress";
import dotenv from 'dotenv'
import { resolve } from "path";

dotenv.config({
  path: resolve(__dirname, '.env.test.local')
})

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

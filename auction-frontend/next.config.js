/** @type {import('next').NextConfig} */

const dotenvExtended = require('dotenv-extended');

if (process.env.NODE_ENV === 'test') {
  dotenvExtended.load({
    path: '.env.test.local',
    defaults: '.env.test',
    overrideProcessEnv: true
  });
}

const nextConfig = {
  reactStrictMode: false, // disable react strict mode to avoid rendering twice in dev mode https://stackoverflow.com/questions/71847778/why-my-nextjs-component-is-rendering-twice
  swcMinify: true,
  env: {
    NEXTAUTH_URL: process.env.NEXTAUTH_URL, //
    BASE_URL: process.env.NEXTAUTH_URL,
    ENABLE_MOCKS: process.env.ENABLE_MOCKS,
  }
}

module.exports = nextConfig

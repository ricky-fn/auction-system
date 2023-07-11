/** @type {import('next').NextConfig} */

const nextConfig = {
  reactStrictMode: false, // disable react strict mode to avoid rendering twice in dev mode https://stackoverflow.com/questions/71847778/why-my-nextjs-component-is-rendering-twice
  swcMinify: true,
  env: {
    NEXTAUTH_URL: "https://main.d1tywrwo86r4jv.amplifyapp.com/",
    BASE_URL: process.env.BASE_URL,
    ENABLE_MOCKS: process.env.ENABLE_MOCKS,
  }
}

module.exports = nextConfig

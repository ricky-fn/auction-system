/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false, // disable react strict mode to avoid rendering twice in dev mode https://stackoverflow.com/questions/71847778/why-my-nextjs-component-is-rendering-twice
  swcMinify: true,
}

module.exports = nextConfig

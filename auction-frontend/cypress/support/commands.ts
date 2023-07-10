import hkdf from "@panva/hkdf";
import { EncryptJWT, JWTPayload } from "jose";
import '@testing-library/cypress/add-commands'

// Function logic derived from https://github.com/nextauthjs/next-auth/blob/5c1826a8d1f8d8c2d26959d12375704b0a693bfc/packages/next-auth/src/jwt/index.ts#L113-L121
async function getDerivedEncryptionKey(secret: string) {
  return await hkdf(
    "sha256",
    secret,
    "",
    "NextAuth.js Generated Encryption Key",
    32
  );
}

// Function logic derived from https://github.com/nextauthjs/next-auth/blob/5c1826a8d1f8d8c2d26959d12375704b0a693bfc/packages/next-auth/src/jwt/index.ts#L16-L25
export async function encode(
  token: JWTPayload,
  secret: string
): Promise<string> {
  const maxAge = 30 * 24 * 60 * 60; // 30 days
  const encryptionSecret = await getDerivedEncryptionKey(secret);
  return await new EncryptJWT(token)
    .setProtectedHeader({ alg: "dir", enc: "A256GCM" })
    .setIssuedAt()
    .setExpirationTime(Date.now() + maxAge * 1000)
    .setJti("test")
    .encrypt(encryptionSecret);
}

declare global {
  namespace Cypress {
    interface Chainable {
      login(userObj: JWTPayload): void;
    }
  }
}

Cypress.Commands.add("login", (userObj: JWTPayload) => {
  // Generate and set a valid cookie from the fixture that next-auth can decrypt
  cy.wrap(null)
    .then(() => {
      debugger;
      return encode(userObj, Cypress.env("NEXTAUTH_JWT_SECRET"));
    })
    .then((encryptedToken) =>
      cy.setCookie("next-auth.session-token", encryptedToken)
    );
});
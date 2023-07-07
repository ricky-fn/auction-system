import NextAuth from "next-auth"

declare module "next-auth" {
  interface Session {
    accessToken?: string;
    idToken?: string;
    profile?: any; // Update the type to match your user profile type
  }

  interface Profile {
    at_hash?: string;
    aud?: string;
    aud: string;
    auth_time?: number;
    'cognito:groups'?: string[];
    'cognito:username'?: string;
    email?: string;
    email_verified?: boolean;
    exp?: number;
    family_name?: string;
    given_name?: string;
    iat?: number;
    identities?: any[];
    iss?: string;
    jti?: string;
    nickname?: string;
    nonce?: string;
    picture?: string;
    sub?: string;
    token_use?: string;
    origin_jti?: string;
  }

  interface JWT {
    accessToken?: string;
    profile?: Profile;
    user?: User;
    refreshToken?: string;
    idToken?: string;
    accessTokenExpires?: number;
  }

}
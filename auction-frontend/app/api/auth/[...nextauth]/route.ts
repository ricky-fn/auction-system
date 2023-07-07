import NextAuth, { AuthOptions, JWT, User } from "next-auth";
import CDKStack from 'auction-shared/outputs.json';
import CognitoProvider from "next-auth/providers/cognito";

async function refreshAccessToken(token: JWT) {
  try {
    const url =
      "https://" + CDKStack.AuctionAuthStack.AuctionUserPoolDomain + "/oauth2/token?" +
      new URLSearchParams({
        grant_type: "refresh_token",
        client_id: CDKStack.AuctionAuthStack.AuctionUserPoolClientId,
        client_secret: CDKStack.AuctionAuthStack.AuctionUserPoolClientSecret,
        refresh_token: token.refreshToken!,
      });


    // Base 64 encode authentication string
    const headerString = CDKStack.AuctionAuthStack.AuctionUserPoolClientId + ':' + CDKStack.AuctionAuthStack.AuctionUserPoolClientSecret;
    const buff = Buffer.from(headerString, 'utf-8');
    const authHeader = buff.toString('base64');

    const refreshedTokensResponse = await fetch(url, {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "Authorization": "Basic " + authHeader
      },
      method: "POST",
    })

    const refreshedTokens = await refreshedTokensResponse.json();

    if (!refreshedTokensResponse.ok) {
      throw refreshedTokens;
    }

    return {
      ...token,
      accessToken: refreshedTokens.access_token,
      accessTokenExpires: Date.now() + refreshedTokens.expires_in * 1000,
      refreshToken: refreshedTokens.refresh_token ?? token.refreshToken, // Fall back to old refresh token
    };

  } catch (error) {

    return {
      ...token,
      error: "RefreshAccessTokenError",
    };
  }
}

export const authOptions: AuthOptions = {
  providers: [
    CognitoProvider({
      clientId: CDKStack.AuctionAuthStack.AuctionUserPoolClientId,
      clientSecret: CDKStack.AuctionAuthStack.AuctionUserPoolClientSecret,
      issuer: `https://cognito-idp.${CDKStack.AuctionAuthStack.AuctionAuthRegion}.amazonaws.com/${CDKStack.AuctionAuthStack.AuctionUserPoolId}`,
      checks: "nonce"
    }),
  ],
  secret: CDKStack.AuctionAuthStack.AuctionUserPoolClientSecret,
  pages: {
    signIn: '/',
  },
  callbacks: {
    async jwt({ token, account, user, profile }) {
      // Initial sign in
      if (account && user) {
        // Max 4096 bytes
        return {
          accessToken: account.access_token,
          idToken: account.id_token, // Too long
          accessTokenExpires: account.expires_at,
          refreshToken: account.refresh_token,
          user, // Too long
          profile, // Too long
        };
      }

      // Return previous token if the access token has not expired yet
      if (Date.now() / 1000 < (token.accessTokenExpires as number)) {
        return token;
      }

      // Access token has expired, try to update it
      return refreshAccessToken(token as JWT);
    },
    async session({ session, token }) {
      const sessionToken = session;
      sessionToken.accessToken = (token as JWT).accessToken;
      sessionToken.idToken = (token as JWT).idToken;
      sessionToken.profile = (token as JWT).profile;
      return sessionToken;
    }
  },
}

const handler = NextAuth(authOptions)

export { handler as GET, handler as POST }

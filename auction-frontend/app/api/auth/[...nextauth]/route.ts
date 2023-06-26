import NextAuth, { AuthOptions, User } from "next-auth";
import CognitoProvider from "next-auth/providers/cognito";
import CDKStack from '../../../../../outputs.json';

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
  // pages: {
  //   signIn: '/auth/signin',
  // }
}

const handler = NextAuth(authOptions)

export { handler as GET, handler as POST }
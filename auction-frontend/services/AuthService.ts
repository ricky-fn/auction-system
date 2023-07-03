import CDKStack from 'auction-shared/outputs.json';
import { CognitoIdentityClient } from "@aws-sdk/client-cognito-identity";
import { fromCognitoIdentityPool } from "@aws-sdk/credential-providers";

export class AuthService {
  private temporaryCredentials: Object | undefined;
  constructor(private jwtToken: string) {
    this.jwtToken = jwtToken;
  }
  public async getTemporaryCredentials() {
    if (this.temporaryCredentials) {
      return this.temporaryCredentials;
    }
    this.temporaryCredentials = await this.generateTemporaryCredentials();
    return this.temporaryCredentials;
  }
  private async generateTemporaryCredentials() {
    const cognitoIdentityPool = `cognito-idp.${CDKStack.AuctionAuthStack.AuctionAuthRegion}.amazonaws.com/${CDKStack.AuctionAuthStack.AuctionUserPoolId}`;
    const cogitoIdentity = new CognitoIdentityClient({
      credentials: fromCognitoIdentityPool({
        clientConfig: { region: CDKStack.AuctionAuthStack.AuctionAuthRegion }, // need to specify region because it runs in browser without local credential
        identityPoolId: CDKStack.AuctionAuthStack.AuctionIdentityPoolId,
        logins: {
          [cognitoIdentityPool]: this.jwtToken! // add ! to tell typescript that this is not undefined
        }
      })
    })

    const credentials = await cogitoIdentity.config.credentials()
    return credentials;
  }
  public updateToken(token: string) {
    this.jwtToken = token;
    this.temporaryCredentials = undefined;
  }
}
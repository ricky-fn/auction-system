import { Amplify, Auth } from 'aws-amplify';
import { AuctionAuthStack } from '../../../outputs.json';
import { CognitoUser } from '@aws-amplify/auth';

Amplify.configure({
  Auth: {
    region: AuctionAuthStack.AuctionAuthRegion,
    userPoolId: AuctionAuthStack.AuctionUserPoolId,
    userPoolWebClientId: AuctionAuthStack.AuctionUserPoolClientId,
    identityPoolId: AuctionAuthStack.AuctionIdentityPoolId,
    authenticationFlowType: 'USER_PASSWORD_AUTH'
  }
});

export class AuthService {
  public async login(userName: string, password: string) {
    const result = await Auth.signIn(userName, password);
    return result;
  }

  // public async generateTemporaryCredentials(user: CognitoUser) { // create the temporary credentials
  //   const jwtToken = user.getSignInUserSession().getIdToken().getJwtToken(); // create the temp credentials based on the user session
  //   const cognitoIdentityPool = `cognito-idp.${awsRegion}.amazonaws.com/ap-southeast-1_d1j91Nghq`;
  //   const cogitoIdentity = new CognitoIdentityClient({
  //     credentials: fromCognitoIdentityPool({ // get the credentials from our identity pool via the user session
  //       identityPoolId: 'ap-southeast-1:bee21345-bfb7-471c-a07d-3b25570c004a',
  //       logins: {
  //         [cognitoIdentityPool]: jwtToken
  //       }
  //     })
  //   })

  //   const credentials = await cogitoIdentity.config.credentials()
  //   return credentials;
  // }

}
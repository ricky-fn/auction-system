import { Amplify, Auth } from "aws-amplify";
import { AuctionAuthStack } from "../../../../outputs.json";
import { CognitoUser } from "@aws-amplify/auth";

Amplify.configure({
	// reference: https://aws-amplify.github.io/amplify-js/api/interfaces/authoptions.html
	Auth: {
		region: AuctionAuthStack.AuctionAuthRegion,
		userPoolId: AuctionAuthStack.AuctionUserPoolId,
		userPoolWebClientId: AuctionAuthStack.AuctionUserPoolClientId,
		authenticationFlowType: "USER_PASSWORD_AUTH",
	}
});

export class AuthService {
	public async login(username: string, password: string) {

		let result;
		try {
			result = await Auth.signIn({
				username, password
			});
		} catch (error) {
			console.log(error);
		}

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
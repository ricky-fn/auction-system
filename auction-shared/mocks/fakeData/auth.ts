export const generateCognitoAuthorizerContext = (username: string) => {
	return {
		requestContext: {
			authorizer: {
				claims: {
					"cognito:username": username
				}
			}
		}
	};
};

export const generateCognitoAuthorizerWithoutUserName = () => {
	return {
		requestContext: {
			authorizer: {
				claims: {}
			}
		}
	};
};
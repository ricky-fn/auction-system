'use client'
import AWS from 'aws-sdk';
import { LambdaClient, InvokeCommand } from '@aws-sdk/client-lambda'
import { signIn } from 'next-auth/react';


export default async function Page() {
  // const client = new LambdaClient({})
  // const command = new InvokeCommand({
  //   FunctionName: 'arn:aws:lambda:ap-south-1:399759979072:function:AuctionLambdaStack-SpacesLambdaA5F923A4-OV1KouOXlweL',
  //   InvocationType: "RequestResponse",
  // });
  // const response = await client.send(command);
  // const result = new TextDecoder('utf-8').decode(response.Payload)
  return (
    <div>
      <button onClick={() => signIn("cognito")}>Sign in</button>
    </div>
  )
}
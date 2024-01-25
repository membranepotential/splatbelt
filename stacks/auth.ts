import Backend from "./backend";
import * as iam from "aws-cdk-lib/aws-iam";
import { Cognito, StackContext, use } from "sst/constructs";

export default function AuthStack({ stack }: StackContext) {
  const { storage, db } = use(Backend);

  const auth = new Cognito(stack, "auth", {
    login: ["username"],
    triggers: {
      preSignUp: "stacks/preSignUp.handler",
    },
    cdk: {
      userPool: {
        passwordPolicy: {
          minLength: 6,
          requireDigits: false,
          requireLowercase: false,
          requireSymbols: false,
          requireUppercase: false,
        },
      },
    },
  });

  auth.attachPermissionsForAuthUsers(stack, [
    storage,
    new iam.PolicyStatement({
      actions: ["s3:*"],
      effect: iam.Effect.ALLOW,
      resources: [
        storage.bucketArn + "/${cognito-identity.amazonaws.com:sub}/*",
      ],
    }),
  ]);

  auth.attachPermissionsForAuthUsers(stack, [
    db,
    new iam.PolicyStatement({
      actions: ["dynamodb:*"],
      effect: iam.Effect.ALLOW,
      resources: [db.tableArn],
      conditions: {
        "ForAllValues:StringEquals": {
          "dynamodb:LeadingKeys": ["${cognito-identity.amazonaws.com:sub}"],
        },
      },
    }),
  ]);

  stack.addOutputs({
    userPoolId: auth.userPoolId,
    userPoolClientId: auth.userPoolClientId,
    identityPoolId: auth.cognitoIdentityPoolId,
  });

  return { auth };
}

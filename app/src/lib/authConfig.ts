import { env } from '$env/dynamic/public'
export default {
  Auth: {
    Cognito: {
      userPoolId: env.PUBLIC_USER_POOL_ID as string,
      userPoolClientId: env.PUBLIC_USER_POOL_CLIENT_ID as string,
      identityPoolId: env.PUBLIC_IDENTITY_POOL_ID as string,
    },
  },
}

import { SvelteKitSite, StackContext, use } from "sst/constructs";
import Auth from "./auth";
import Backend from "./backend";

export default function App({ stack }: StackContext) {
  const { auth } = use(Auth);
  const { storage, db } = use(Backend);

  const site = new SvelteKitSite(stack, "app", {
    path: "app/",
    bind: [auth, storage, db],
    environment: {
      USER_POOL_ID: auth.userPoolId,
      USER_POOL_CLIENT_ID: auth.userPoolClientId,
      IDENTITY_POOL_ID: auth.cognitoIdentityPoolId ?? "",
    },
    customDomain: {
      domainName: "splatbelt.cepheid.xyz",
      hostedZone: "cepheid.xyz",
    },
  });

  stack.addOutputs({
    URL: site.url,
  });

  return { site };
}

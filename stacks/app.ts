import { SvelteKitSite, StackContext, Config, use } from "sst/constructs";
import Auth from "./auth";
import Backend from "./backend";

export default function App({ stack }: StackContext) {
  const { auth } = use(Auth);
  const { storage, db } = use(Backend);

  const CLIENT_SECRET = new Config.Secret(stack, "CLIENT_SECRET");

  const site = new SvelteKitSite(stack, "app", {
    path: "app/",
    bind: [auth, storage, db, CLIENT_SECRET],
    environment: {
      PUBLIC_USER_POOL_ID: auth.userPoolId,
      PUBLIC_USER_POOL_CLIENT_ID: auth.userPoolClientId,
      PUBLIC_IDENTITY_POOL_ID: auth.cognitoIdentityPoolId ?? "",
    },
    customDomain: {
      domainName: "splatbelt.cepheid.xyz",
      hostedZone: "cepheid.xyz",
    },
  });

  stack.addOutputs({
    URL: site.customDomainUrl || site.url,
  });

  return { site };
}

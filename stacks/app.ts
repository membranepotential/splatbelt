import { SvelteKitSite, StackContext, use } from "sst/constructs";
import Backend from "./backend";

export default function App({ stack }: StackContext) {
  const { storage, db } = use(Backend);

  const site = new SvelteKitSite(stack, "app", {
    path: "app/",
    bind: [storage, db],
  });

  stack.addOutputs({
    URL: site.url,
  });
}

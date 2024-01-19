import { SSTConfig } from "sst";
import App from "./stacks/app";
import Backend from "./stacks/backend";

export default {
  config(_input) {
    return {
      name: "splatbelt",
      region: "us-east-1",
    };
  },
  stacks(app) {
    app.stack(Backend).stack(App);
  }
} satisfies SSTConfig;

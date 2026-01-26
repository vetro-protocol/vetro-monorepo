// See https://www.i18next.com/overview/typescript#create-a-declaration-file
import "i18next";

import { resources } from "./resources";

declare module "i18next" {
  interface CustomTypeOptions {
    defaultNS: "translation";
    resources: (typeof resources)["en"];
  }
}

// See https://www.i18next.com/overview/typescript#create-a-declaration-file
import { resources } from "./resources";

declare module "i18next" {
  interface CustomTypeOptions {
    defaultNS: "translation";
    resources: typeof resources;
  }
}

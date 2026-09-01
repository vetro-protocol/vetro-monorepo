import type { Preview } from "@storybook/react";
import { sb } from "storybook/test";

import "react-loading-skeleton/dist/skeleton.css";

import "../src/index.css";

sb.mock(import("../src/fetchers/fetchPrices.ts"));

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
  },
};

export default preview;

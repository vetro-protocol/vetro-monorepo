import type { Preview } from "@storybook/react";

import "react-loading-skeleton/dist/skeleton.css";

import "../src/index.css";
import { initializeI18n } from "../src/i18n/config";

initializeI18n();

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

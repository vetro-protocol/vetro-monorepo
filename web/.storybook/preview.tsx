import type { Preview } from "@storybook/react";
import i18next from "i18next";

import "react-loading-skeleton/dist/skeleton.css";

import "../src/index.css";
import { initializeI18n } from "../src/i18n/config";

if (!i18next.isInitialized) {
  void initializeI18n();
}

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

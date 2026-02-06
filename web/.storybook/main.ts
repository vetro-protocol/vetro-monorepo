import type { StorybookConfig } from "@storybook/react-vite";

const config: StorybookConfig = {
  addons: [],
  framework: {
    name: "@storybook/react-vite",
    options: {},
  },
  stories: ["../stories/*.stories.@(ts|tsx)"],
  viteFinal(config) {
    // Remove the cloudflare plugin - not needed for Storybook.
    config.plugins = config.plugins?.flat().filter((plugin) => {
      const name = plugin && "name" in plugin ? plugin.name : "";
      const isCloudflare = name
        .toLowerCase()
        .startsWith("vite-plugin-cloudflare");
      return !isCloudflare;
    });
    return config;
  },
};

export default config;

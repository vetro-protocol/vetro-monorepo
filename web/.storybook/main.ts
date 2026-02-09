import type { StorybookConfig } from "@storybook/react-vite";

const config: StorybookConfig = {
  addons: [],
  framework: {
    name: "@storybook/react-vite",
    options: {},
  },
  stories: ["../stories/*.stories.@(ts|tsx)"],
  viteFinal(conf) {
    // Remove the cloudflare plugin - not needed for Storybook.
    conf.plugins = conf.plugins?.flat().filter(function (plugin) {
      const name = plugin && "name" in plugin ? plugin.name : "";
      const isCloudflare = name
        .toLowerCase()
        .startsWith("vite-plugin-cloudflare");
      return !isCloudflare;
    });
    return conf;
  },
};

export default config;

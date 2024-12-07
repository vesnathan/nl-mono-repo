import { nextui } from "@nextui-org/react";

const tailwindConfig = {
  content: [
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  screens: {
    xs: "0px",
  },
  plugins: [
    nextui({
      themes: {
        dark: {
          colors: {
            primary: {
              foreground: "#000000",
            },
          },
        },
        light: {
          colors: {
            primary: {
              foreground: "#000000",
            },
          },
        },
      },
    }),
  ],
};

export default tailwindConfig;

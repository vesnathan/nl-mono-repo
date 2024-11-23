import { nextui } from "@nextui-org/react";
import { tailwindTheme } from "@/config/tailwindTheme";

const tailwindConfig = {
  content: [
    // next-ui
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  // important: true,
  screens: {
    xs: "0px",
  },
  theme: {
    extend: tailwindTheme,
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

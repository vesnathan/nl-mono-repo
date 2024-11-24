import { nextui } from "@nextui-org/react";
import { CWLTailwindTheme } from "./src/config/CWLTailwindTheme";

const tailwindConfig = {
  content: [
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  screens: {
    xs: "0px",
  },
  theme: {
    extend: {
      gridTemplateColumns: CWLTailwindTheme.gridTemplateColumns,
      fontSize: CWLTailwindTheme.fontSize,
      fontWeight: CWLTailwindTheme.fontWeight,
      colors: CWLTailwindTheme.colors, // Explicitly extend colors
    },
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

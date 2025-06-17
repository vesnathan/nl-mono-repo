import { nextui } from "@nextui-org/react";

const tailwindConfig = {
  content: [
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "../../../node_modules/@nextui-org/theme/dist/**/*.{js,ts,jsx,tsx}",
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
              foreground: "#FFFFFF", // Changed from #000000
            },
          },
        },
        light: {
          colors: {
            primary: {
              foreground: "#FFFFFF", // Changed from #000000
            },
          },
        },
      },
    }),
  ],
};

export default tailwindConfig;

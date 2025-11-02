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
  theme: {
    extend: {
      colors: {
        // Story Hub brand colors from logo
        "brand-dark": "#21271C", // Dark grey/green background
        "brand-purple": "#422F9F", // Primary purple
        "brand-blue": "#2162BF", // Secondary blue
        "brand-orange": "#F28C28", // Accent orange (from old logo)
      },
    },
  },
  plugins: [
    nextui({
      themes: {
        light: {
          colors: {
            background: "#FFFFFF",
            foreground: "#21271C",
            primary: {
              50: "#f0ebff",
              100: "#ddd1ff",
              200: "#c7b4ff",
              300: "#a88dff",
              400: "#8864ff",
              500: "#6a3fff",
              600: "#422F9F", // Brand purple
              700: "#3a2885",
              800: "#31206b",
              900: "#281950",
              DEFAULT: "#422F9F",
              foreground: "#FFFFFF",
            },
            secondary: {
              50: "#e6f1ff",
              100: "#c2ddff",
              200: "#99c7ff",
              300: "#6bb0ff",
              400: "#469aff",
              500: "#2162BF", // Brand blue
              600: "#1c54a3",
              700: "#174587",
              800: "#12366b",
              900: "#0d284f",
              DEFAULT: "#2162BF",
              foreground: "#FFFFFF",
            },
            success: {
              DEFAULT: "#F28C28",
              foreground: "#FFFFFF",
            },
            focus: "#2162BF",
          },
        },
        dark: {
          colors: {
            background: "#21271C",
            foreground: "#FFFFFF",
            primary: {
              50: "#f0ebff",
              100: "#ddd1ff",
              200: "#c7b4ff",
              300: "#a88dff",
              400: "#8864ff",
              500: "#6a3fff",
              600: "#422F9F",
              700: "#3a2885",
              800: "#31206b",
              900: "#281950",
              DEFAULT: "#422F9F",
              foreground: "#FFFFFF",
            },
            secondary: {
              50: "#e6f1ff",
              100: "#c2ddff",
              200: "#99c7ff",
              300: "#6bb0ff",
              400: "#469aff",
              500: "#2162BF",
              600: "#1c54a3",
              700: "#174587",
              800: "#12366b",
              900: "#0d284f",
              DEFAULT: "#2162BF",
              foreground: "#FFFFFF",
            },
            success: {
              DEFAULT: "#F28C28",
              foreground: "#FFFFFF",
            },
            focus: "#2162BF",
          },
        },
      },
    }),
  ],
};

export default tailwindConfig;

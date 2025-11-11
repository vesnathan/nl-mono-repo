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
        // Card Counting Trainer brand colors (casino theme)
        "casino-green": "#0C5F38", // Casino table green
        "casino-red": "#D32F2F", // Casino red
        "casino-gold": "#FFD700", // Gold accents
        "casino-felt": "#1B5E3F", // Felt table color
        "casino-dark": "#1A1A1A", // Dark background
      },
    },
  },
  plugins: [
    nextui({
      themes: {
        light: {
          colors: {
            background: "#FFFFFF",
            foreground: "#1A1A1A",
            primary: {
              50: "#e8f5f0",
              100: "#c3e6d8",
              200: "#9cd6be",
              300: "#73c6a4",
              400: "#55b990",
              500: "#36ad7c",
              600: "#2e9d71",
              700: "#238b62",
              800: "#187953",
              900: "#0C5F38", // Casino green
              DEFAULT: "#0C5F38",
              foreground: "#FFFFFF",
            },
            secondary: {
              50: "#fff9e6",
              100: "#fff0c2",
              200: "#ffe699",
              300: "#ffdc70",
              400: "#ffd451",
              500: "#FFD700", // Gold
              600: "#f5c700",
              700: "#e5b400",
              800: "#d5a200",
              900: "#c08600",
              DEFAULT: "#FFD700",
              foreground: "#1A1A1A",
            },
            danger: {
              DEFAULT: "#D32F2F",
              foreground: "#FFFFFF",
            },
            success: {
              DEFAULT: "#0C5F38",
              foreground: "#FFFFFF",
            },
            focus: "#FFD700",
          },
        },
        dark: {
          colors: {
            background: "#1A1A1A",
            foreground: "#FFFFFF",
            primary: {
              50: "#e8f5f0",
              100: "#c3e6d8",
              200: "#9cd6be",
              300: "#73c6a4",
              400: "#55b990",
              500: "#36ad7c",
              600: "#2e9d71",
              700: "#238b62",
              800: "#187953",
              900: "#0C5F38",
              DEFAULT: "#0C5F38",
              foreground: "#FFFFFF",
            },
            secondary: {
              50: "#fff9e6",
              100: "#fff0c2",
              200: "#ffe699",
              300: "#ffdc70",
              400: "#ffd451",
              500: "#FFD700",
              600: "#f5c700",
              700: "#e5b400",
              800: "#d5a200",
              900: "#c08600",
              DEFAULT: "#FFD700",
              foreground: "#1A1A1A",
            },
            danger: {
              DEFAULT: "#D32F2F",
              foreground: "#FFFFFF",
            },
            success: {
              DEFAULT: "#0C5F38",
              foreground: "#FFFFFF",
            },
            focus: "#FFD700",
          },
        },
      },
    }),
  ],
};

export default tailwindConfig;

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
        // Lawn Order brand colors matching original template
        "brand-green": "#98bc24", // Main green from original
        "brand-yellow": "#fab702", // Yellow accent from original
        "brand-dark": "#282828", // Dark background from original
      },
      fontFamily: {
        'josefin': ['"Josefin Sans"', 'sans-serif'],
        'roboto-slab': ['"Roboto Slab"', 'serif'],
      },
    },
  },
  plugins: [
    nextui({
      themes: {
        light: {
          colors: {
            background: "#FFFFFF",
            foreground: "#2D5016",
            primary: {
              50: "#f1f8e9",
              100: "#dcedc8",
              200: "#c5e1a5",
              300: "#aed581",
              400: "#9ccc65",
              500: "#8bc34a",
              600: "#7CB342", // Brand lime green
              700: "#689f38",
              800: "#558b2f",
              900: "#33691e",
              DEFAULT: "#7CB342",
              foreground: "#FFFFFF",
            },
            secondary: {
              50: "#e3f2fd",
              100: "#bbdefb",
              200: "#90caf9",
              300: "#64b5f6",
              400: "#42A5F5", // Brand sky blue
              500: "#2196f3",
              600: "#1e88e5",
              700: "#1976d2",
              800: "#1565c0",
              900: "#0d47a1",
              DEFAULT: "#42A5F5",
              foreground: "#FFFFFF",
            },
            success: {
              DEFAULT: "#7CB342",
              foreground: "#FFFFFF",
            },
            focus: "#7CB342",
          },
        },
        dark: {
          colors: {
            background: "#1a1a1a",
            foreground: "#FFFFFF",
            primary: {
              50: "#f1f8e9",
              100: "#dcedc8",
              200: "#c5e1a5",
              300: "#aed581",
              400: "#9ccc65",
              500: "#8bc34a",
              600: "#7CB342",
              700: "#689f38",
              800: "#558b2f",
              900: "#33691e",
              DEFAULT: "#7CB342",
              foreground: "#FFFFFF",
            },
            secondary: {
              50: "#e3f2fd",
              100: "#bbdefb",
              200: "#90caf9",
              300: "#64b5f6",
              400: "#42A5F5",
              500: "#2196f3",
              600: "#1e88e5",
              700: "#1976d2",
              800: "#1565c0",
              900: "#0d47a1",
              DEFAULT: "#42A5F5",
              foreground: "#FFFFFF",
            },
            success: {
              DEFAULT: "#7CB342",
              foreground: "#FFFFFF",
            },
            focus: "#7CB342",
          },
        },
      },
    }),
  ],
};

export default tailwindConfig;

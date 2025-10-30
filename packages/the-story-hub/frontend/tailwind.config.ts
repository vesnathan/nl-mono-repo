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
        'brand-purple': '#3B1D5A',
        'brand-brown': '#885E3C',
        'brand-green': '#6BBF59',
        'brand-orange': '#F28C28',
        'brand-blue': '#40A6FF',
        'brand-beige': '#F5EFE6',
      },
    },
  },
  plugins: [
    nextui({
      themes: {
        light: {
          colors: {
            background: "#F5EFE6", // Light beige/parchment
            foreground: "#3B1D5A", // Deep purple for text
            primary: {
              50: "#f5f0ff",
              100: "#ede5ff",
              200: "#dccfff",
              300: "#c3adff",
              400: "#a280ff",
              500: "#8454ff",
              600: "#7233f7",
              700: "#6320e3",
              800: "#531bbf",
              900: "#3B1D5A", // Deep purple - main brand color
              DEFAULT: "#3B1D5A",
              foreground: "#FFFFFF",
            },
            secondary: {
              50: "#fff7ed",
              100: "#ffedd5",
              200: "#fed7aa",
              300: "#fdba74",
              400: "#fb923c",
              500: "#F28C28", // Bright orange
              600: "#ea580c",
              700: "#c2410c",
              800: "#9a3412",
              900: "#7c2d12",
              DEFAULT: "#F28C28",
              foreground: "#FFFFFF",
            },
            success: {
              DEFAULT: "#6BBF59", // Fresh green
              foreground: "#FFFFFF",
            },
            focus: "#40A6FF", // Sky blue
          },
        },
        dark: {
          colors: {
            background: "#1a1a1a",
            foreground: "#F5EFE6",
            primary: {
              50: "#f5f0ff",
              100: "#ede5ff",
              200: "#dccfff",
              300: "#c3adff",
              400: "#a280ff",
              500: "#8454ff",
              600: "#7233f7",
              700: "#6320e3",
              800: "#531bbf",
              900: "#3B1D5A",
              DEFAULT: "#7233f7",
              foreground: "#FFFFFF",
            },
            secondary: {
              DEFAULT: "#F28C28",
              foreground: "#FFFFFF",
            },
            success: {
              DEFAULT: "#6BBF59",
              foreground: "#FFFFFF",
            },
            focus: "#40A6FF",
          },
        },
      },
    }),
  ],
};

export default tailwindConfig;

import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Pulled from the Eve Research logo: deep navy + sage green.
        brand: {
          DEFAULT: "#1f3d57",
          dark: "#152b3e",
          light: "#90a687",
        },
        sage: {
          DEFAULT: "#90a687",
          dark: "#6f8767",
        },
      },
    },
  },
  plugins: [],
};

export default config;

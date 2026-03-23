/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#eef6ff",
          100: "#dbeafe",
          200: "#bddbff",
          500: "#4f8cc9",
          600: "#3c76ad"
        }
      },
      boxShadow: {
        card: "0 10px 30px rgba(15, 23, 42, 0.08)"
      },
      fontFamily: {
        sans: ["'Plus Jakarta Sans'", "ui-sans-serif", "system-ui", "sans-serif"]
      }
    }
  },
  plugins: []
};

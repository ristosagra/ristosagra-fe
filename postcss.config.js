import tailwindcss from "@tailwindcss/postcss";

//Tailwind v4 gestisce già i prefissi dei browser: autoprefixer non serve
export default {
  plugins: [tailwindcss],
};

/** @type {import('tailwindcss').Config} */
// Tailwind 3.4 core utilities only. The custom bits (text-2xs, z-layers,
// vault blur, reduced-motion) live in the injected QuestStyles, per canon 02.
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: { extend: {} },
  plugins: [],
}

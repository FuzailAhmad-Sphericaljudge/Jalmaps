/**
 * @type {import('lint-staged').Configuration}
 */
export default {
  "*.{js,jsx,ts,tsx,mjs,mts}": ["prettier --write", "eslint --fix --no-warn-ignored"],
  "*.{json,css,md,yml,yaml}": ["prettier --write"],
};

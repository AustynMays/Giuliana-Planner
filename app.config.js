// Extends app.json. BASE_URL lets the built site live in a sub-folder,
// e.g. "/Giuliana-Planner" on GitHub Pages. Empty means the site root.
module.exports = ({ config }) => ({
  ...config,
  experiments: {
    ...config.experiments,
    baseUrl: (process.env.BASE_URL || "").replace(/\/+$/, ""),
  },
});

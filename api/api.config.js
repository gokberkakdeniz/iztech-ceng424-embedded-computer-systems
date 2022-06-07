module.exports = {
  apps: [
    {
      name: "api",
      script: "./src/server.js",
      env_production: {
        NODE_ENV: "production",
      },
      env_development: {
        NODE_ENV: "development",
      },
      cwd: "/home/rodones/ceng424/api",
    },
  ],
};

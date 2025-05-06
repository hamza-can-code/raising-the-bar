const serverless = require('@vendia/serverless-express');
const app = require('../server/index');  // Adjust if your Express app is elsewhere

module.exports = serverless({ app });

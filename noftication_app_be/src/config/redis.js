const Redis = require("ioredis");

const connection = new Redis();

module.exports = connection;
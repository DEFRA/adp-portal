process.env.TZ = 'UTC';

/** @type {Promise<unknown>} */
const baseConfig = require('@backstage/cli/config/jest.js');

module.exports = (async function () {
  return {
    ...(await baseConfig),
  };
})();

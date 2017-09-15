/**
 * Helper tool to clear responses previously saved to Predix Asset Service
 */

const logger = require('../utils/logger');
const { removeAllResponses } = require('../services/predix');

removeAllResponses().then(() => {
  logger.info('Responses are removed successfully.');
}).catch((err) => {
  logger.error(err);
});

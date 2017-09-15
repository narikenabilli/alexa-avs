/**
 * Helper tool to view responses previously saved to Predix Asset Service
 */

const logger = require('../utils/logger');
const { getResponses } = require('../services/predix');

getResponses().then((reponses) => {
  console.log(JSON.stringify(reponses, null, 4)); // eslint-disable-line no-console
}).catch((err) => {
  logger.error(err);
});

/**
 * Helper tool to populate Predix Asset Service with data
 *
 * It removes all existent surveys and create new one from /data/surveys.json
 */

const logger = require('../utils/logger');
const { createSurveys, removeAllSurveys } = require('../services/predix');

const data = require('../../../data/surveys.json');

removeAllSurveys().then(() => createSurveys(data).then(() => {
  logger.info('Surveys are created successfully.');
})).catch((err) => {
  logger.error(err);
});

const winston = require('winston');
const config = require('../../../config/config');
const path = require('path');

const logger = new (winston.Logger)({
  transports: [
    new (winston.transports.Console)({
      level: config.logLevel,
      colorize: true,
    }),
    new (winston.transports.File)({
      name: 'log-verbose',
      level: 'verbose',
      filename: path.resolve(__dirname, '../../../server-verbose.log'),
    }),
    new (winston.transports.File)({
      name: 'log-error',
      level: 'error',
      filename: path.resolve(__dirname, '../../../server-error.log'),
    }),
  ],
});

module.exports = logger;

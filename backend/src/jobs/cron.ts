import cron from 'node-cron';
import { env } from '../config/env';
import logger from '../common/utils/logger';

export function startKeepAliveCron() {
  // Run every 15 minutes
  cron.schedule('*/15 * * * *', async () => {
    try {
      const url = `http://localhost:${env.port}/`;
      logger.info(`Running 15-min keep-alive ping to ${url}`);
      
      const response = await fetch(url);
      
      if (!response.ok) {
        logger.error(`Keep-alive ping failed with status: ${response.status}`);
      } else {
        logger.info('Keep-alive ping successful');
      }
    } catch (error) {
      logger.error('Error during keep-alive ping:', error);
    }
  });
}

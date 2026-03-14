import { Signale } from 'signale';

const logger = new Signale({
  config: {
    displayTimestamp: true,
    displayDate: false,
  },
});

export default logger;

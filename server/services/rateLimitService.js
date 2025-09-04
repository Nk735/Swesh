import RateCounter from '../models/RateCounter.js';
import { getUTCDateKey } from '../utils/dateKey.js';

export const DAILY_LIMIT = 50;

export async function incrementDailyProposalsOrThrow(userId) {
  const dateKey = getUTCDateKey();
  let counter = await RateCounter.findOne({ userId, dateKey });
  if (!counter) {
    counter = await RateCounter.create({ userId, dateKey, proposalsCount: 0 });
  }
  if (counter.proposalsCount >= DAILY_LIMIT) {
    const err = new Error(`Limite giornaliero proposte raggiunto (${DAILY_LIMIT}). Torna domani!`);
    err.statusCode = 429;
    throw err;
  }
  counter.proposalsCount += 1;
  await counter.save();
  return counter.proposalsCount;
}
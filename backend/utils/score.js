const Engagement = require('../models/Engagement');
const Participation = require('../models/Participation');

/**
 * Calculates a user's engagement score for a specific event.
 * @param {string} userId - The ID of the user.
 * @param {string} eventId - The ID of the event.
 * @returns {Promise<number>} The total engagement score.
 */
async function getUserEventScore(userId, eventId) {
  try {
    // 1. Calculate scores from specific actions (polls, Q&A, downloads)
    const engagements = await Engagement.find({ userId, eventId });
    let pollScore = 0;
    let qaScore = 0;
    let downloadScore = 0;

    engagements.forEach(eng => {
      if (eng.action === 'poll') pollScore += 10;
      if (eng.action === 'qa') qaScore += 15;
      if (eng.action === 'download') downloadScore += 5;
    });

    // 2. Calculate score from time spent in the session
    const participation = await Participation.findOne({ userId, eventId });
    let timeScore = 0;
    if (participation && participation.joinTime && participation.lastSeen) {
      const minutesInSession = (participation.lastSeen.getTime() - participation.joinTime.getTime()) / 1000 / 60;
      timeScore = Math.floor(minutesInSession * 0.1);
    }

    // 3. Return the total score
    return pollScore + qaScore + downloadScore + timeScore;
  } catch (error) {
    console.error(`Error calculating score for user ${userId} in event ${eventId}:`, error);
    return 0; // Return 0 if there's an error
  }
}

module.exports = { getUserEventScore }; 
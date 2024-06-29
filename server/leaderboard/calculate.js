import { workerData, parentPort } from 'worker_threads'
import { getRankedScore, getScore } from '../util/scores'
import { calcSamples } from './samples'
import config from '../config/server'

const {
  data: {
    solves,
    users,
    graphUpdate,
    allChallenges
  }
} = workerData

console.log({ allChallenges })
const solveAmount = new Map()
const challengeTiebreakEligibles = new Map()
for (let i = 0; i < allChallenges.length; i++) {
  const challenge = allChallenges[i]
  solveAmount.set(challenge.id, 0)
  challengeTiebreakEligibles.set(challenge.id, challenge.tiebreakEligible)
}
const userSolves = new Map()
const userTiebreakEligibleLastSolves = new Map()
const userLastSolves = new Map()
let lastIndex = 0

const calculateScores = (sample) => {
  const challengeValues = new Map()
  const userScores = []
  const challengeRankedMetadata = new Map()

  for (; lastIndex < solves.length; lastIndex++) {
    const challId = solves[lastIndex].challengeid
    const userId = solves[lastIndex].userid
    const createdAt = solves[lastIndex].createdat
    const solveScore = solves[lastIndex].metadata.score || 0

    if (createdAt > sample) {
      break
    }

    const amt = solveAmount.get(challId)
    if (amt === undefined) {
      continue
    }
    solveAmount.set(challId, amt + 1)

    userLastSolves.set(userId, createdAt)
    if (challengeTiebreakEligibles.get(challId) !== false) { // !== false because we default to true
      userTiebreakEligibleLastSolves.set(userId, createdAt)
    }
    // Store which challenges each user solved for later
    if (!userSolves.has(userId)) {
      userSolves.set(userId, [{ challId, solveScore }])
    } else {
      userSolves.get(userId).push({ challId, solveScore })
    }
  }

  let maxSolveAmount = 0
  for (let i = 0; i < allChallenges.length; i++) {
    const amt = solveAmount.get(allChallenges[i].id)
    if (amt > maxSolveAmount) {
      maxSolveAmount = amt
    }
  }

  for (let i = 0; i < allChallenges.length; i++) {
    if (allChallenges[i].type === 'ranked') {
      challengeRankedMetadata.set(allChallenges[i].id, { ... allChallenges[i].rankedMetadata, min: allChallenges[i].points.min, max: allChallenges[i].points.max })
    }
  }

  for (let i = 0; i < allChallenges.length; i++) {
    const challenge = allChallenges[i]
    challengeValues.set(challenge.id, getScore(
      challenge.points.min,
      challenge.points.max,
      maxSolveAmount,
      solveAmount.get(challenge.id)
    ))
  }

  const rankedSolvesForLogging = []
  for (let i = 0; i < users.length; i++) {
    const user = users[i]
    let currScore = 0
    const lastTiebreakEligibleSolve = userTiebreakEligibleLastSolves.get(user.id)
    const lastSolve = userLastSolves.get(user.id)
    if (lastSolve === undefined) continue // If the user has not solved any challenges, do not add to leaderboard
    const solvedChalls = userSolves.get(user.id)
    for (let j = 0; j < solvedChalls.length; j++) {
      const { challId: solvedChallId, solveScore } = solvedChalls[j]
      const rankedMetadata = challengeRankedMetadata.get(solvedChallId)
      let value = undefined
      if (rankedMetadata !== undefined) {
        // If the challenge is ranked, calculate this on a per-solve basis
        value = getRankedScore(
          rankedMetadata.min,
          rankedMetadata.max,
          rankedMetadata.minScore,
          rankedMetadata.maxScore,
          solveScore
        )
        rankedSolvesForLogging.push({
          userId: user.id,
          challengeId: solvedChallId,
          score: solveScore,
          value,
          min: rankedMetadata.min,
          max: rankedMetadata.max,
          minScore: rankedMetadata.minScore,
          maxScore: rankedMetadata.maxScore
        })
      } else {
        // Add the score for the specific solve loaded from the challengeValues array using ids

        value = challengeValues.get(solvedChallId)
      }

      if (value !== undefined) {
        currScore += value
      }
    }
    userScores.push([
      user.id,
      user.name,
      user.division,
      currScore,
      lastTiebreakEligibleSolve,
      lastSolve
    ])
  }

  console.log({ rankedSolvesForLogging })
  console.log({ challengeRankedMetadata })

  return {
    challengeValues,
    userScores
  }
}

const userCompare = (a, b) => {
  // sort the users by score
  // if two user's scores are the same, sort by last tiebreakEligible solve time
  // if neither user has any tiebreakEligible solves, sort by last solve time
  const scoreCompare = b[3] - a[3]
  if (scoreCompare !== 0) {
    return scoreCompare
  }
  if (a[4] !== undefined || b[4] !== undefined) {
    return (a[4] ?? Infinity) - (b[4] ?? Infinity)
  }
  return a[5] - b[5]
}

const leaderboardUpdate = Math.min(Date.now(), config.endTime)
const samples = calcSamples({
  start: Math.max(graphUpdate + 1, config.startTime),
  end: leaderboardUpdate
})

const graphLeaderboards = []
samples.forEach((sample) => {
  const { userScores } = calculateScores(sample)
  graphLeaderboards.push({
    sample,
    scores: userScores.map((score) => [score[0], score[3]])
  })
})

const { userScores, challengeValues } = calculateScores(leaderboardUpdate)
const sortedUsers = userScores.sort(userCompare).map((user) => user.slice(0, 4))

console.log({ sortedUsers })

parentPort.postMessage({
  leaderboard: sortedUsers,
  graphLeaderboards,
  challengeValues,
  solveAmount,
  leaderboardUpdate
})

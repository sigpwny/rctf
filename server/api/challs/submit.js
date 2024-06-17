import crypto from 'crypto'
import * as db from '../../database'
import * as challenges from '../../challenges'
import { responses } from '../../responses'
import config from '../../config/server'
import * as timeouts from '../../cache/timeouts'
import { v4 as uuidv4 } from 'uuid'

export default {
  method: 'POST',
  path: '/challs/:id/submit',
  requireAuth: true,
  schema: {
    body: {
      type: 'object',
      properties: {
        flag: {
          type: 'string'
        }
      },
      required: ['flag']
    },
    params: {
      type: 'object',
      properties: {
        id: {
          type: 'string'
        }
      },
      required: ['id']
    }
  },
  handler: async ({ req, user }) => {
    const uuid = user.id

    const timeNow = Date.now()
    if (timeNow < config.startTime) {
      return responses.badNotStarted
    }
    if (timeNow > config.endTime) {
      return responses.badEnded
    }

    const challengeid = req.params.id
    const submittedFlag = req.body.flag

    const challenge = challenges.getChallenge(challengeid)

    req.log.info({
      chall: challengeid,
      flag: submittedFlag
    }, 'flag submission attempt')

    if (!challenge) {
      return responses.badChallenge
    }

    const passRateLimit = await timeouts.checkRateLimit({
      type: timeouts.getChallengeType(challengeid),
      userid: uuid,
      duration: 10 * 1000,
      limit: 3
    })

    if (!passRateLimit.ok) {
      req.log.warn({
        timeLeft: passRateLimit.timeLeft
      }, 'flag submission rate limit exceeded')
      return [responses.badRateLimit, {
        timeLeft: passRateLimit.timeLeft
      }]
    }

    const bufSubmittedFlag = Buffer.from(submittedFlag)
    const bufCorrectFlag = Buffer.from(challenge.flag)

    const challengeType = challenge.type
    let submittedHash, submittedLength = null

    if (challengeType === 'ranked') {
      const parts = submittedFlag.split('.')
      if (parts.length !== 2) {
        return responses.badFlagRanked
      }
      [submittedHash, submittedLength] = parts

      // The user will receive SHA256(FLAG || answerLength) || '.' || answerLength
      
      const correctHash = crypto.createHash('sha256').update(bufCorrectFlag).update(submittedLength.toString()).digest('hex')
      if (!crypto.timingSafeEqual(submittedHash, correctHash)) {
        return responses.badFlagRanked
      }

    } else {

      if (bufSubmittedFlag.length !== bufCorrectFlag.length) {
        return responses.badFlag
      }
  
      if (!crypto.timingSafeEqual(bufSubmittedFlag, bufCorrectFlag)) {
        return responses.badFlag
      }
    }

    try {
      const metadata = (challengeType === 'ranked') ? { length: submittedLength } : {}
      // If we are a ranked challenge and we have a better solve, we want to delete the old solve
      if (challengeType === 'ranked') {
        const oldSolve = db.solves.getSolveByUserIdAndChallId({ userid: uuid, challengeid })
        if (oldSolve && oldSolve.metadata.length > submittedLength) {
          await db.solves.removeSolvesByUserIdAndChallId({ userid: uuid, challengeid })
        }
      }
      await db.solves.newSolve({ id: uuidv4(), challengeid: challengeid, userid: uuid, createdat: new Date(), metadata })
      return (challengeType === 'ranked') ? responses.goodFlagRanked : responses.goodFlag
    } catch (e) {
      if (e.constraint === 'uq') {
        // not a unique submission, so the user already solved
        return (challengeType === 'ranked') ? responses.badAlreadySolvedChallengeRanked : responses.badAlreadySolvedChallenge
      }
      if (e.constraint === 'uuid_fkey') {
        // the user referenced by the solve isnt in the users table
        return responses.badUnknownUser
      }
      throw e
    }
  }
}

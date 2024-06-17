import { Challenge } from './types'
import { deepCopy } from '../util'
import { DatabaseChallenge } from '../database/challenges'

const ChallengeDefaults: Challenge = {
  id: '',
  name: '',
  description: '',
  category: '',
  author: '',
  files: [],
  tiebreakEligible: true,
  points: {
    min: 0,
    max: 0
  },
  flag: '',
  type: 'dynamic'
}

export const applyChallengeDefaults = (chall: Challenge): Challenge => {
  const copy = deepCopy(ChallengeDefaults)

  return {
    ...copy,
    ...chall
  }
}

export const challengeToRow = (challIn: Challenge): DatabaseChallenge => {
  const { id, ...chall } = deepCopy(challIn)

  return {
    id,
    data: chall
  }
}
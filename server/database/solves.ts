import db from './db'
import type { Challenge } from '../challenges/types'
import type { User } from './users'
import type { ExtractQueryType } from './util'

export interface SolveMetadata {
  solveLength?: number;
}

export interface Solve {
  id: string;
  challengeid: Challenge['id'];
  userid: User['id'];
  createdat: Date;
  metadata: SolveMetadata;
}

//         psql "$RCTF_DATABASE_URL" -c $'INSERT INTO challenges (id, data) VALUES (\'id\', \'{"flag": "flag{good_flag}", "name": "name", "files": [], "author": "author", "points": {"max": 500, "min": 100}, "category": "category", "description": "description", "tiebreakEligible": true}\')'

export const getAllSolves = (): Promise<Solve[]> => {
  return db.query<Solve>('SELECT * FROM solves ORDER BY createdat ASC')
    .then(res => res.rows)
}

export const getSolvesByUserId = ({ userid }: Pick<Solve, 'userid'>): Promise<Solve[]> => {
  return db.query<Solve>('SELECT * FROM solves WHERE userid = $1 ORDER BY createdat DESC', [userid])
    .then(res => res.rows)
}

export const getSolvesByChallId = ({ challengeid, limit, offset }: Pick<Solve, 'challengeid'> & { limit: number; offset: number; }): Promise<(Solve & Pick<User, 'name'>)[]> => {
  return db.query<ExtractQueryType<typeof getSolvesByChallId>>('SELECT solves.id, solves.userid, solves.createdat, solves.metadata, users.name FROM solves INNER JOIN users ON solves.userid = users.id WHERE solves.challengeid=$1 ORDER BY solves.createdat ASC LIMIT $2 OFFSET $3', [challengeid, limit, offset])
    .then(res => res.rows)
}

export const getSolveByUserIdAndChallId = ({ userid, challengeid }: Pick<Solve, 'userid' | 'challengeid'>): Promise<Solve | undefined> => {
  return db.query<Solve>('SELECT * FROM solves WHERE userid = $1 AND challengeid = $2 ORDER BY createdat DESC', [userid, challengeid])
    .then(res => res.rows[0])
}

export const newSolve = ({ id, userid, challengeid, createdat, metadata }: Solve): Promise<Solve> => {
  return db.query<Solve>('INSERT INTO solves (id, challengeid, userid, createdat, metadata) VALUES ($1, $2, $3, $4, $5) RETURNING *', [id, challengeid, userid, createdat, metadata])
    .then(res => res.rows[0])
}

export const removeSolvesByUserId = async ({ userid }: Pick<Solve, 'userid'>): Promise<void> => {
  await db.query('DELETE FROM solves WHERE userid = $1', [userid])
}

export const removeSolvesByUserIdAndChallId = async ({ userid, challengeid }: Pick<Solve, 'userid' | 'challengeid'>): Promise<void> => {
  await db.query('DELETE FROM solves WHERE userid = $1 AND challengeid = $2', [userid, challengeid])
}
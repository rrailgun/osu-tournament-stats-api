import pgPromise from 'pg-promise';

const pgp = pgPromise();
const db = pgp(`postgres://${process.env.PG_USERNAME}:${process.env.PG_PASSWORD}@${process.env.PG_HOST}:${process.env.PG_PORT}/osu_stats`)

export default db;
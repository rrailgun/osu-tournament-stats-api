import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import bodyParser from 'body-parser';
import { Auth } from 'osu-web.js';
import apiRouter from './routes';
import { PlayerService } from './services/player.service';

dotenv.config();
const app = express();

const osuApiAuth = new Auth(Number(process.env.OSU_CLIENT_ID), process.env.OSU_CLIENT_SECRET || '', 'http://localhost:4200/auth');
const authGrant = osuApiAuth.authorizationCodeGrant(['identify']);

app.use(express.json());
app.use(cors({
    origin: 'http://localhost:4200',
    credentials: true
}));
app.use(bodyParser.json());

app.post('/auth', async (req, res) => {
    let code = req.body.code;
    if (!code) return res.status(400).send({ error: 'Code is required' });
    try {
        let token = await authGrant.requestToken(code);
        let user = await PlayerService.syncUser(token.access_token);
        res.send({ token, user });
    }
    catch (err) {
        console.error(err);
        res.status(500).send({ error: 'Failed to authenticate' });
    }
});

app.use('/api', apiRouter);

export default app;

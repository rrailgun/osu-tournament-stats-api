import express from 'express';
import dotenv from 'dotenv';
dotenv.config()

import playerRouter from './routes/player.route';


const app = express();
const apiRouter = express.Router();
app.use(express.json());

apiRouter.use('/players', playerRouter);

app.use('/api', apiRouter)


app.listen(3000, () => {
    console.log("running on 3000")
});
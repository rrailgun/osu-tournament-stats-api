import { NextFunction, Request, Response } from "express";


export async function isBasicAuthenticated(req: Request, res: Response, next: NextFunction) {
    if (req.user) next()
    else res.sendStatus(401);
}

export default isBasicAuthenticated;
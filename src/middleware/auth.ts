import { Request, Response, NextFunction } from "express";

export function isBasicAuthenticated(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.sendStatus(401);
  }

  // Extract the token and attach it to req
  req.token = authHeader.replace(/^Bearer\s+/i, '');

  next();
}

export default isBasicAuthenticated;

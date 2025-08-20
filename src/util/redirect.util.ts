import { Response, Request } from "express";
import { validationResult } from "express-validator";


export function checkForErrors(req: Request, res: Response) {
    let errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    return false;
}
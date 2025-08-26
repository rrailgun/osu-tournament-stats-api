import { Response, Request } from "express";
import { validationResult } from "express-validator";


export async function checkForErrors(req: Request, res: Response): Promise<boolean> {
    let errors = validationResult(req);
    if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return true;
    }
    return false;
}
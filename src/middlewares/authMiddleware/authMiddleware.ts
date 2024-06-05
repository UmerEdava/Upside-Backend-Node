import { NextFunction, Request, Response } from "express";
import { ApiError } from "../errorHandler/ApiError";
import { JWT } from "../../utils/jwt/jwt";
import service from "../../modules/auth/service";
import { userModelTypes } from "../../modules/auth/model";

interface JwtPayload {
    userId: string
    origin: string
};

declare global {
    namespace Express {
        interface Request {
            jwtData?: JwtPayload
            userId?: string
            user?: userModelTypes
        }
    }
}

// Auth middleware
export const authMiddleware = async (req: Request, res: Response, next: NextFunction) => {
    try {
        let cookie = req?.cookies['user-cookie'];

        let jwtData = await JWT.verifyJwtToken(cookie) as JwtPayload;
        if (cookie && jwtData) {

            // verify user id
            const userExist = await service.checkUserExist({_id: jwtData.userId}) as userModelTypes;
            if (!userExist) {
                return next(new ApiError(401, "Not Authorized"));
            }

            req['jwtData'] = jwtData;
            req['userId'] = jwtData['userId']
            req['user'] = userExist

            next();
        } else {
            return next(new ApiError(401, "Not Authorized"));
        }
    }
    catch (error: any) {
        if (error.message == "jwt expired") {
            return next(new ApiError(401, "Not Authorized"));
        } else {
            return next(new ApiError(401, "Not Authorized"));
        }
    }
}
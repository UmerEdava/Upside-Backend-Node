import { Request, Response, NextFunction } from "express";
import httpStatus from "http-status";

import { ApiError } from "../../middlewares/errorHandler/ApiError";
import { JWT } from "../../utils/jwt/jwt";
import { log } from "../../config/logger";
import { Bcrypt } from "../../utils/bcrypt/Bcrypt";
import { userModelTypes } from "./model";

import * as types from "../../utils/types/types";
import Service from './service';
import UserService from '../user/service'

export default {
    loginController: async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { username, password }: types.LOGIN_BODY = req.body;
            const userExist = await Service.checkUserExist({
                $or: [
                    { username }, { email: username }, { mobile_number: username }
                ]
            }) as userModelTypes

            if (!userExist) {
                return next(new ApiError(httpStatus.BAD_REQUEST, 'Invalid credentials'));
            };

            try {
                await Bcrypt.compare(password, userExist?.password as string);
            }
            catch (err) {
                return next(new ApiError(httpStatus.UNAUTHORIZED, 'Incorrect password'));
            }

            // Activate account
            if (userExist.isDeactivated) {   
                await UserService.updateUser({
                    query: { _id: userExist?._id },
                    updateDoc: { isDeactivated: false }
                })
            }

            const token = await JWT.generateJwtToken(
                {
                    userId: userExist?._id,
                    origin: req.headers?.origin || "dev",
                }
            );
            res.cookie('user-cookie', token, {
                httpOnly: true,
                // secure: process.env.NODE_ENV === "development" ? false : true,
                secure: true,
                maxAge: 10 * 24 * 60 * 60 * 1000 /* day * hour * 60 * 60 * 1000  */,
                sameSite: "none"
            })

            delete userExist?.password;
            return res.json({
                status: true,
                message: "Login Success",
                data: userExist
            })
        }
        catch (err) {
            log.debug("Error while login");
            log.error(err);
            return next(new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Internal Server Error'));
        }
    },
    signup: async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { username, email }: types.SIGNUP_BODY = req.body;
            const userExist = await Service.checkUserExist({
                $or: [
                    { username }, { email }
                ]
            });
            if (userExist) {
                return next(new ApiError(httpStatus.BAD_REQUEST, 'User already exist'));
            };

            const user = await Service.createUser(req.body, {});

            const token = await JWT.generateJwtToken(
                {
                    userId: user?._id,
                    origin: req.headers?.origin || "dev",
                },

            );
            res.cookie('user-cookie', token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === "development" ? false : true,
                maxAge: 10 * 24 * 60 * 60 * 1000 /* day * hour * 60 * 60 * 1000  */,
                sameSite: "strict"
            })

            return res.send({
                status: true,
                data: user,
                message: "User registered successfully."
            });

        } catch (err) {
            log.debug("Error while signup");
            log.error(err);
            return next(new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Internal Server Error'));
        }
    },
    verifyAuth: async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { userId } = req;
            const user = await Service.checkUserExist({ _id: userId }) as userModelTypes;
            if (!user) {
                res.clearCookie('user-cookie', {
                    httpOnly: true,
                    secure: process.env.NODE_ENV === "development" ? false : true,
                    sameSite: 'strict'
                })
                return next(new ApiError(httpStatus.BAD_REQUEST, 'User not found'));
            }
            delete user.password;
            return res.send(user)
        } catch (err) {
            log.debug("Error while verify auth");
            log.error(err);
            return next(new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Internal Server Error'));
        }
    },
    logout: async (req: Request, res: Response, next: NextFunction) => {
        try {
            res.clearCookie('user-cookie', {
                httpOnly: true,
                secure: process.env.NODE_ENV === "development" ? false : true,
                sameSite: 'strict'
            });
            res.json({
                status: true,
                message: "Logged out succssfully",
            });
        } catch (err) {
            log.debug("Error while logout");
            log.error(err);
            return next(new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Internal Server Error'));
        }
    }
}
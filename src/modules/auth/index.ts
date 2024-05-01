import { authMiddleware } from '../../middlewares/authMiddleware/authMiddleware';
import express from 'express';
import controller from './controller';
import validator from './validator';
const authRouter = express.Router();

authRouter.post('/login', validator.login, controller.loginController);
authRouter.post('/signup', validator.signup, controller.signup);
authRouter.use(authMiddleware);
authRouter.get('/verify-auth', controller.verifyAuth);
authRouter.post('/logout', controller.logout);


export default authRouter;

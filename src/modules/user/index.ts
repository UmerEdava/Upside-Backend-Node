import { authMiddleware } from '../../middlewares/authMiddleware/authMiddleware';
import express from 'express';
import controller from './controller';
import validator from './validator';
const userRouter = express.Router();

userRouter.use(authMiddleware);
userRouter.get('/follow/:id', validator.followUser, controller.followUnfollowController);
userRouter.get('/:id', validator.getUserById, controller.getUserByIdOrUsernameController);
userRouter.put('/', validator.updateUser, controller.updateUserController);



export default userRouter;
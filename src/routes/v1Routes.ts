import express from 'express';
import authRouter from '../modules/auth';
import userRouter from '../modules/user';
import postRouter from '../modules/post';
import chatRouter from '../modules/chat';


const v1Routes = express.Router();


v1Routes.use('/auth', authRouter);
v1Routes.use('/user', userRouter);
v1Routes.use('/post', postRouter);
v1Routes.use('/chat', chatRouter);




export default v1Routes;
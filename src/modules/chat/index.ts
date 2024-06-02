import { authMiddleware } from '../../middlewares/authMiddleware/authMiddleware';
import express from 'express';
import controller from './controller';
import validator from './validator';
const chatRouter = express.Router();

chatRouter.use(authMiddleware);
chatRouter.post('/messages', validator.sendMessage, controller.sendMessageController);
chatRouter.get('/getAllChats', controller.getUserChatsController);
chatRouter.get('/search/:username', validator.searchChats, controller.getChatsAndUsersByUsernameController);
chatRouter.get('/:chatId/messages', controller.getChatMessagesController);

// chatRouter.put('/', validator.updatePost, controller.updatePostController);
// chatRouter.get('/user', controller.getCurrentUserPostsController);
// chatRouter.get('/user/:idOrUsername', validator.getAllOtherUserPosts, controller.getAllPostsController);
// chatRouter.get('/feed', controller.getFeedPostsController);
// chatRouter.get('/:id', validator.getPost, controller.getPostController);
// chatRouter.put('/like', validator.likePost, controller.likeUnlikePostController);

// chatRouter.put('/comment', validator.commentPost, controller.commentPostController);

// chatRouter.delete('/comment', validator.deleteComment, controller.deleteCommentController);
// chatRouter.delete('/:id', validator.deletePost, controller.deletePostController);

// chatRouter.put('/comment/like', validator.likeComment, controller.likeUnlikeCommentController);




export default chatRouter;

import { authMiddleware } from '../../middlewares/authMiddleware/authMiddleware';
import express from 'express';
import controller from './controller';
import validator from './validator';
const postRouter = express.Router();

postRouter.use(authMiddleware);
postRouter.post('/', validator.createPost, controller.createPostController);
postRouter.put('/', validator.updatePost, controller.updatePostController);
postRouter.get('/user', controller.getCurrentUserPostsController);
postRouter.get('/user/:idOrUsername', validator.getAllOtherUserPosts, controller.getAllPostsController);
postRouter.get('/feed', controller.getFeedPostsController);
postRouter.get('/:id', validator.getPost, controller.getPostController);
postRouter.put('/like', validator.likePost, controller.likeUnlikePostController);

postRouter.put('/comment', validator.commentPost, controller.commentPostController);

postRouter.delete('/comment', validator.deleteComment, controller.deleteCommentController);
postRouter.delete('/:id', validator.deletePost, controller.deletePostController);

postRouter.put('/comment/like', validator.likeComment, controller.likeUnlikeCommentController);




export default postRouter;

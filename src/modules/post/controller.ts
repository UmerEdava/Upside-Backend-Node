import { Request, Response, NextFunction } from "express";
import httpStatus from "http-status";
import { v2 as cloudinary } from "cloudinary";

import { ApiError } from "../../middlewares/errorHandler/ApiError";
import { JWT } from "../../utils/jwt/jwt";
import { log } from "../../config/logger";
import { Bcrypt } from "../../utils/bcrypt/Bcrypt";
import { postModelTypes } from "./model";

import * as types from "../../utils/types/types";
import UserService from "../user/service";
import Service from "./service";
import { userModelTypes } from "../auth/model";
import { isMongoId } from "../../utils/common_functions/common_functions";

export default {
  createPostController: async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const { text } = req.body;

      let { img } = req.body;

      if (!text && !img) {
        return next(
          new ApiError(httpStatus.BAD_REQUEST, "Please provide text or image")
        );
      }

      if (img) {
        const uploadedResponse = await cloudinary.uploader.upload(img);
        img = uploadedResponse.secure_url;
      }

      const newPost = await Service.createPost(
        {
          postedBy: req.userId as string,
          text,
          img,
        },
        { 
        }
      );

      // fetch post details with populate postedBy
      const postDetails = await Service.getPostById(newPost._id);

      return res.json({
        status: true,
        message: "Post added successfully",
        data: postDetails,
      });
    } catch (err) {
      console.log("🚀 ~ createPostController: ~ err:", err);
      log.debug("Error while creating post");
      log.error(err);
      return next(
        new ApiError(httpStatus.INTERNAL_SERVER_ERROR, "Internal Server Error")
      );
    }
  },
  updatePostController: async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const { _id, text } = req.body;
      let { img } = req.body;

      const postDetails = (await Service.getPostById(_id)) as postModelTypes;

      if (!postDetails) {
        return next(new ApiError(httpStatus.BAD_REQUEST, "Post not found."));
      }

      postDetails.text = text || postDetails.text;

      if (img) {
        const uploadedResponse = await cloudinary.uploader.upload(img);
        img = uploadedResponse.secure_url;
      } else {
        img = postDetails.img;
      }

      const updatedUser = await Service.updatePostByDoc({
        query: { _id },
        updateDoc: postDetails,
        opts: { new: true },
      });

      return res.json({
        status: true,
        message: "Post edited successfully",
        data: postDetails,
      });
    } catch (err) {
      log.debug("Error while editing post");
      log.error(err);
      return next(
        new ApiError(httpStatus.INTERNAL_SERVER_ERROR, "Internal Server Error")
      );
    }
  },
  deletePostController: async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const { id } = req.params;

      const postDetails = (await Service.getPostById(id)) as postModelTypes;

      if (!postDetails) {
        return next(new ApiError(httpStatus.BAD_REQUEST, "Post not found."));
      }

      const deletedPost = await Service.updatePostByDoc({
        query: { _id: id },
        updateDoc: { isDeleted: true },
        opts: { new: true },
      });

      return res.json({
        status: true,
        message: "Post deleted successfully",
        data: {},
      });
    } catch (err) {
      log.debug("Error while deleting post");
      log.error(err);
      return next(
        new ApiError(httpStatus.INTERNAL_SERVER_ERROR, "Internal Server Error")
      );
    }
  },
  getCurrentUserPostsController: async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const posts = (await Service.getAllPosts({
        query: { postedBy: req.userId },
      })) as postModelTypes[];

      return res.json({
        status: true,
        message: "Posts fetched successfully",
        data: {
          posts,
        },
      });
    } catch (err) {
      log.debug("Error while fetching posts");
      log.error(err);
      return next(
        new ApiError(httpStatus.INTERNAL_SERVER_ERROR, "Internal Server Error")
      );
    }
  },
  getAllPostsController: async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const { idOrUsername } = req.params;

      const mongoId = isMongoId(idOrUsername);

      let userId = idOrUsername;
      if (!mongoId) {
        const user = (await UserService.getUser({
          query: { username: idOrUsername },
        })) as userModelTypes;
        if (!user) {
          return next(new ApiError(httpStatus.BAD_REQUEST, "User not found"));
        }
        userId = user._id;
      }

      const posts = (await Service.getAllPosts({
        query: { $and: [{ postedBy: userId }, { isDeleted: false }] },
        opts: {
          populateQuery: {
            path: "postedBy",
            select: ["_id", "name", "username", "profilePic"],
          },
          sortOption: { createdAt: -1 },
        },
      })) as postModelTypes[];

      return res.json({
        status: true,
        message: "Posts fetched successfully",
        data: {
          posts,
        },
      });
    } catch (err) {
      log.debug("Error while fetching posts");
      log.error(err);
      return next(
        new ApiError(httpStatus.INTERNAL_SERVER_ERROR, "Internal Server Error")
      );
    }
  },
  getPostController: async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const { id } = req.params;

      const post = (await Service.getPost({
        query: {
          _id: id,
          isDeleted: false,
        },
        opts: {
          populateQuery: [
            {
              path: "postedBy",
              select: ["_id", "name", "username", "profilePic"],
            },
            {
              path: "comments",
              select: ["_id", "text", "userId"],
              populate: {
                path: "userId",
                select: ["_id", "name", "username", "profilePic"],
              },
            },
          ],
        },
      })) as postModelTypes;

      if (!post) {
        return next(new ApiError(httpStatus.BAD_REQUEST, "Post not found."));
      }

      // Add latest on top sorting in comments
      post.comments = post.comments.sort((a: any, b: any) => {
        return (
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
      });
      console.log("🚀 ~ post.comments=post.comments.sort ~ post.comments:", post.comments)

      // Filter out deleted comments
      post.comments = post.comments.filter(
        (comment: any) => comment.isDeleted === false || !comment.isDeleted 
      );

      return res.json({
        status: true,
        message: "Post fetched successfully",
        data: {
          post,
        },
      });
    } catch (err) {
      log.debug("Error while fetching post");
      log.error(err);
      return next(
        new ApiError(httpStatus.INTERNAL_SERVER_ERROR, "Internal Server Error")
      );
    }
  },
  likeUnlikePostController: async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const { postId } = req.body;
      const userId = req.userId;

      const postDetails = (await Service.getPostById(postId)) as postModelTypes;

      if (!postDetails) {
        return next(new ApiError(httpStatus.BAD_REQUEST, "Post not found."));
      }

      const isLiked = postDetails.likes.some(
        (like: any) => like + "" === userId + ""
      );

      if (isLiked) {
        // unlike
        postDetails.likes = postDetails.likes.filter(
          (like: any) => like + "" !== userId + ""
        );
        const updatedPost = await Service.updatePostByDoc({
          query: { _id: postId },
          updateDoc: { likes: postDetails.likes },
          opts: { new: true },
        });

        return res.json({
          status: true,
          message: "Unliked successfully",
          data: updatedPost,
        });
      } else {
        // like
        console.log("🚀 ~ likeUnlikePostController: ~ userId:", userId);
        postDetails.likes.push(userId as string);
        const updatedPost = await Service.updatePostByDoc({
          query: { _id: postId },
          updateDoc: { likes: postDetails.likes },
          opts: { new: true },
        });
        console.log(
          "🚀 ~ likeUnlikePostController: ~ updatedPost:",
          updatedPost
        );

        return res.json({
          status: true,
          message: "Liked successfully",
          data: updatedPost,
        });
      }
    } catch (err) {
      log.debug("Error while editing post");
      log.error(err);
      return next(
        new ApiError(httpStatus.INTERNAL_SERVER_ERROR, "Internal Server Error")
      );
    }
  },
  commentPostController: async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const { postId, text } = req.body;

      const userId = req.userId;

      const postDetails = (await Service.getPostById(postId)) as postModelTypes;

      if (!postDetails) {
        return next(new ApiError(httpStatus.BAD_REQUEST, "Post not found."));
      }

      const newComment = {
        userId,
        text,
      };

      const comments = [...postDetails.comments, newComment];

      const updatedPost = await Service.updatePostByDoc({
        query: { _id: postId },
        updateDoc: {
          comments,
        },
        opts: { new: true },
      });

      return res.json({
        status: true,
        message: "Comment added successfully",
        data: updatedPost,
      });
    } catch (err) {
      log.debug("Error while editing post");
      log.error(err);
      return next(
        new ApiError(httpStatus.INTERNAL_SERVER_ERROR, "Internal Server Error")
      );
    }
  },
  getFeedPostsController: async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    console.log('inside feed')
    try {
      const followingList = req.user?.following || [];

      const feedPosts = (await Service.getAllPosts({
        query: { postedBy: { $in: followingList }, isDeleted: false },
        opts: {
          populateQuery: {
            path: "postedBy",
            select: ["_id", "name", "username", "profilePic"],
          },
        },
      })) as postModelTypes[];

      return res.json({
        status: true,
        message: "Feed posts fetched successfully",
        data: {
          feedPosts,
        },
      });
    } catch (err) {
      log.debug("Error while fetching feed posts");
      log.error(err);
      return next(
        new ApiError(httpStatus.INTERNAL_SERVER_ERROR, "Internal Server Error")
      );
    }
  },
  deleteCommentController: async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      console.log("in delete comment controller");
      const { postId, commentId } = req.query;

      const userId = req.userId;

      const postDetails = (await Service.getPostById(
        postId as string
      )) as postModelTypes;
      console.log("🚀 ~ postDetails:", postDetails);

      if (!postDetails) {
        return next(new ApiError(httpStatus.BAD_REQUEST, "Post not found."));
      }

      // Find comment
      const comment = postDetails.comments.find(
        (comment: any) => comment._id + "" === commentId + ""
      );
      console.log("🚀 ~ comment:", comment);

      if (!comment) {
        return next(new ApiError(httpStatus.BAD_REQUEST, "Comment not found."));
      }

      if (comment.userId + "" !== userId + "") {
        return next(
          new ApiError(
            httpStatus.UNAUTHORIZED,
            "You are not authorized to delete this comment"
          )
        );
      }

      // delete comment (update the comment as isDeleted true)
      const updatedPost = await Service.updatePostByQuery({
        query: { _id: postId, "comments._id": commentId },
        updateQuery: {
          $set: {
            "comments.$.isDeleted": true,
          },
        },
        opts: { new: true },
      });
      console.log("🚀 ~ updatedPost:", updatedPost);

      return res.json({
        status: true,
        message: "Comment added successfully",
        data: updatedPost,
      });
    } catch (err) {
      log.debug("Error while editing post");
      log.error(err);
      return next(
        new ApiError(httpStatus.INTERNAL_SERVER_ERROR, "Internal Server Error")
      );
    }
  },

  likeUnlikeCommentController: async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const { postId, commentId } = req.body;
      const userId = req.userId;
      console.log("🚀 ~ userId:", userId);

      const postDetails = (await Service.getPost({
        query: {
          _id: postId,
          isDeleted: false,
          "comments._id": commentId,
          "comments.userId": userId,
          "comments.isDeleted": false,
        },
        opts: {},
      })) as postModelTypes;
      console.log("🚀 ~ postDetails:", postDetails);

      if (!postDetails) {
        return next(new ApiError(httpStatus.BAD_REQUEST, "Post not found."));
      }

      // find comment

      const comment = postDetails.comments.find(
        (comment: any) => comment._id + "" === commentId + ""
      );

      if (!comment) {
        return next(new ApiError(httpStatus.BAD_REQUEST, "Comment not found."));
      }

      const isLiked = comment.likes.some(
        (like: any) => like + "" === userId + ""
      );

      if (isLiked) {
        // unlike
        comment.likes = comment.likes.filter(
          (like: any) => like + "" !== userId + ""
        );
        const updatedPost = await Service.updatePostByQuery({
          query: { _id: postId, "comments._id": commentId },
          updateQuery: {
            $set: {
              "comments.$.likes": comment.likes,
            },
          },
          opts: { new: true },
        });

        return res.json({
          status: true,
          message: "Unliked successfully",
          data: updatedPost,
        });
      } else {
        // like
        console.log("🚀 ~ likeUnlikePostController: ~ userId:", userId);
        comment.likes.push(userId as string);
        const updatedPost = await Service.updatePostByQuery({
          query: { _id: postId, "comments._id": commentId },
          updateQuery: {
            $set: {
              "comments.$.likes": comment.likes,
            },
          },
          opts: { new: true },
        });
        console.log(
          "🚀 ~ likeUnlikePostController: ~ updatedPost:",
          updatedPost
        );

        return res.json({
          status: true,
          message: "Liked successfully",
          data: updatedPost,
        });
      }
    } catch (err) {
      log.debug("Error while editing post");
      log.error(err);
      return next(
        new ApiError(httpStatus.INTERNAL_SERVER_ERROR, "Internal Server Error")
      );
    }
  },
};

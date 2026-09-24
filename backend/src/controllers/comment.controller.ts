import { Response, NextFunction } from 'express';
import { commentService } from '../services/comment.service';
import { activityService } from '../services/activity.service';
import { AuthenticatedRequest } from '../types';
import { sendSuccess } from '../utils/response';

export class CommentController {
  async createComment(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const comment = await commentService.createComment(req.params.ticketId, req.body, req.user!);
      return sendSuccess(res, comment, 'Comment added successfully', 201);
    } catch (err) {
      next(err);
    }
  }

  async getComments(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const comments = await commentService.getComments(req.params.ticketId, req.user!);
      return sendSuccess(res, comments, 'Comments retrieved', 200);
    } catch (err) {
      next(err);
    }
  }

  async getActivity(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const activities = await activityService.getActivitiesByTicketId(req.params.ticketId, req.user!);
      return sendSuccess(res, activities, 'Audit activities retrieved', 200);
    } catch (err) {
      next(err);
    }
  }
}

export const commentController = new CommentController();

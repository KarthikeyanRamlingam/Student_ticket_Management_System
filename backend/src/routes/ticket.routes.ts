import { Router } from 'express';
import { ticketController } from '../controllers/ticket.controller';
import { commentController } from '../controllers/comment.controller';
import { authenticate, authorize } from '../middleware/auth';
import { validateBody, validateQuery } from '../middleware/validate';
import { uploadAttachment } from '../middleware/upload';
import { Role } from '@prisma/client';
import {
  createTicketSchema,
  updateStatusSchema,
  assignTicketSchema,
  updatePrioritySchema,
  escalateTicketSchema,
  reopenTicketSchema,
  listTicketsQuerySchema
} from '../validators/ticket.validator';
import { createCommentSchema } from '../validators/comment.validator';

const router = Router();

// Ticket CRUD & Lifecycle
router.post(
  '/',
  authenticate,
  uploadAttachment.single('attachment'),
  validateBody(createTicketSchema),
  (req, res, next) => ticketController.createTicket(req, res, next)
);

router.get(
  '/',
  authenticate,
  validateQuery(listTicketsQuerySchema),
  (req, res, next) => ticketController.listTickets(req, res, next)
);

router.get('/:id', authenticate, (req, res, next) => ticketController.getTicketById(req, res, next));

router.patch(
  '/:id/status',
  authenticate,
  validateBody(updateStatusSchema),
  (req, res, next) => ticketController.updateStatus(req, res, next)
);

router.patch(
  '/:id/claim',
  authenticate,
  authorize(Role.STAFF, Role.ADMIN),
  (req, res, next) => ticketController.claimTicket(req, res, next)
);

router.patch(
  '/:id/assign',
  authenticate,
  authorize(Role.STAFF, Role.ADMIN),
  validateBody(assignTicketSchema),
  (req, res, next) => ticketController.assignTicket(req, res, next)
);

router.patch(
  '/:id/priority',
  authenticate,
  authorize(Role.STAFF, Role.ADMIN),
  validateBody(updatePrioritySchema),
  (req, res, next) => ticketController.updatePriority(req, res, next)
);

router.patch(
  '/:id/escalate',
  authenticate,
  authorize(Role.STAFF, Role.ADMIN),
  validateBody(escalateTicketSchema),
  (req, res, next) => ticketController.escalateTicket(req, res, next)
);

router.post(
  '/:id/reopen',
  authenticate,
  validateBody(reopenTicketSchema),
  (req, res, next) => ticketController.reopenTicket(req, res, next)
);

// Comments and Audit Activity
router.post(
  '/:ticketId/comments',
  authenticate,
  validateBody(createCommentSchema),
  (req, res, next) => commentController.createComment(req, res, next)
);

router.get('/:ticketId/comments', authenticate, (req, res, next) => commentController.getComments(req, res, next));

router.get('/:ticketId/activity', authenticate, (req, res, next) => commentController.getActivity(req, res, next));

export default router;

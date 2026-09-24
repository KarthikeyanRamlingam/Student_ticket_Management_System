import { Response, NextFunction } from 'express';
import { ticketService } from '../services/ticket.service';
import { AuthenticatedRequest } from '../types';
import { sendSuccess } from '../utils/response';

export class TicketController {
  async createTicket(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const ticket = await ticketService.createTicket(req.body, req.user!, req.file);
      return sendSuccess(res, ticket, 'Ticket created successfully', 201);
    } catch (err) {
      next(err);
    }
  }

  async listTickets(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const result = await ticketService.listTickets(req.query as any, req.user!);
      return sendSuccess(res, result.tickets, 'Tickets retrieved', 200, result.meta);
    } catch (err) {
      next(err);
    }
  }

  async getTicketById(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const ticket = await ticketService.getTicketById(req.params.id, req.user!);
      return sendSuccess(res, ticket, 'Ticket retrieved', 200);
    } catch (err) {
      next(err);
    }
  }

  async updateStatus(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const ticket = await ticketService.updateStatus(req.params.id, req.body, req.user!);
      return sendSuccess(res, ticket, 'Ticket status updated', 200);
    } catch (err) {
      next(err);
    }
  }

  async claimTicket(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const ticket = await ticketService.claimTicket(req.params.id, req.user!);
      return sendSuccess(res, ticket, 'Ticket claimed successfully', 200);
    } catch (err) {
      next(err);
    }
  }

  async assignTicket(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const ticket = await ticketService.assignTicket(req.params.id, req.body.staffId, req.user!);
      return sendSuccess(res, ticket, 'Ticket assigned successfully', 200);
    } catch (err) {
      next(err);
    }
  }

  async updatePriority(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const ticket = await ticketService.updatePriority(
        req.params.id,
        req.body.priority,
        req.body.reason,
        req.user!
      );
      return sendSuccess(res, ticket, 'Priority updated successfully', 200);
    } catch (err) {
      next(err);
    }
  }

  async escalateTicket(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const ticket = await ticketService.escalateTicket(
        req.params.id,
        req.body.escalationLevel,
        req.body.reason,
        req.user!
      );
      return sendSuccess(res, ticket, 'Ticket escalated successfully', 200);
    } catch (err) {
      next(err);
    }
  }

  async reopenTicket(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const ticket = await ticketService.reopenTicket(req.params.id, req.body.reason, req.user!);
      return sendSuccess(res, ticket, 'Ticket reopened successfully', 200);
    } catch (err) {
      next(err);
    }
  }
}

export const ticketController = new TicketController();

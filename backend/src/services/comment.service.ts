import { prisma } from '../config/prisma';
import { AppError } from '../middleware/errorHandler';
import { CommentVisibility, Role, TicketStatus, ActivityType } from '@prisma/client';
import { JwtPayload } from '../types';

export class CommentService {
  async createComment(
    ticketId: string,
    data: { message: string; visibility?: CommentVisibility },
    user: JwtPayload
  ) {
    const ticket = await prisma.ticket.findUnique({
      where: { id: ticketId }
    });

    if (!ticket) {
      throw new AppError('Ticket not found.', 404);
    }

    // Role-based security checks
    if (user.role === Role.STUDENT) {
      // Student can only comment on their own ticket
      if (ticket.studentId !== user.userId) {
        throw new AppError('Unauthorized to comment on this ticket.', 403);
      }
      // Students can NEVER post INTERNAL notes
      if (data.visibility === CommentVisibility.INTERNAL) {
        throw new AppError('Students cannot create internal notes.', 403);
      }
    }

    const visibility = data.visibility || CommentVisibility.PUBLIC;

    const result = await prisma.$transaction(async (tx) => {
      // Create comment
      const comment = await tx.ticketComment.create({
        data: {
          ticketId,
          authorId: user.userId,
          message: data.message.trim(),
          visibility
        },
        include: {
          author: {
            select: { id: true, name: true, role: true, email: true }
          }
        }
      });

      // Activity record
      await tx.ticketActivity.create({
        data: {
          ticketId,
          actorId: user.userId,
          eventType: ActivityType.COMMENT_ADDED,
          newValue: visibility,
          metadata: {
            visibility,
            preview: data.message.substring(0, 100)
          }
        }
      });

      // Pending-action workflow:
      // If student replies to a WAITING_FOR_STUDENT ticket, automatically transition to IN_PROGRESS
      if (user.role === Role.STUDENT && ticket.status === TicketStatus.WAITING_FOR_STUDENT) {
        await tx.ticket.update({
          where: { id: ticketId },
          data: {
            status: TicketStatus.IN_PROGRESS,
            updatedAt: new Date()
          }
        });

        await tx.ticketActivity.create({
          data: {
            ticketId,
            actorId: user.userId,
            eventType: ActivityType.STUDENT_REPLIED,
            oldValue: TicketStatus.WAITING_FOR_STUDENT,
            newValue: TicketStatus.IN_PROGRESS,
            metadata: {
              info: 'Ticket automatically returned to IN_PROGRESS following student response.'
            }
          }
        });
      }

      return comment;
    });

    return result;
  }

  async getComments(ticketId: string, user: JwtPayload) {
    const ticket = await prisma.ticket.findUnique({
      where: { id: ticketId },
      select: { id: true, studentId: true }
    });

    if (!ticket) {
      throw new AppError('Ticket not found.', 404);
    }

    if (user.role === Role.STUDENT && ticket.studentId !== user.userId) {
      throw new AppError('Access denied.', 403);
    }

    const where: any = { ticketId };
    // Students NEVER receive internal notes
    if (user.role === Role.STUDENT) {
      where.visibility = CommentVisibility.PUBLIC;
    }

    return prisma.ticketComment.findMany({
      where,
      include: {
        author: {
          select: { id: true, name: true, role: true, email: true }
        }
      },
      orderBy: { createdAt: 'asc' }
    });
  }
}

export const commentService = new CommentService();

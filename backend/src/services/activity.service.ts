import { prisma } from '../config/prisma';
import { AppError } from '../middleware/errorHandler';
import { Role } from '@prisma/client';
import { JwtPayload } from '../types';

export class ActivityService {
  async getActivitiesByTicketId(ticketId: string, user: JwtPayload) {
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

    return prisma.ticketActivity.findMany({
      where: { ticketId },
      include: {
        actor: {
          select: { id: true, name: true, role: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
  }
}

export const activityService = new ActivityService();

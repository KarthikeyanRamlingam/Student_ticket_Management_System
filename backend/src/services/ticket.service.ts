import { prisma } from '../config/prisma';
import { AppError } from '../middleware/errorHandler';
import {
  Role,
  TicketStatus,
  Priority,
  EscalationLevel,
  ActivityType,
  CommentVisibility,
  Prisma
} from '@prisma/client';
import { generateTicketNumber } from '../utils/ticketNumber';
import { calculateSlaDueDate, computeTicketMetrics } from '../utils/slaCalculator';
import { JwtPayload } from '../types';

export const VALID_TRANSITIONS: Record<TicketStatus, TicketStatus[]> = {
  OPEN: [TicketStatus.ASSIGNED, TicketStatus.IN_PROGRESS, TicketStatus.WAITING_FOR_STUDENT, TicketStatus.RESOLVED],
  ASSIGNED: [TicketStatus.IN_PROGRESS, TicketStatus.WAITING_FOR_STUDENT, TicketStatus.RESOLVED, TicketStatus.OPEN],
  IN_PROGRESS: [TicketStatus.WAITING_FOR_STUDENT, TicketStatus.RESOLVED, TicketStatus.ASSIGNED],
  WAITING_FOR_STUDENT: [TicketStatus.IN_PROGRESS, TicketStatus.RESOLVED],
  RESOLVED: [TicketStatus.CLOSED, TicketStatus.REOPENED],
  CLOSED: [],
  REOPENED: [TicketStatus.IN_PROGRESS, TicketStatus.WAITING_FOR_STUDENT, TicketStatus.RESOLVED]
};

export class TicketService {
  async createTicket(
    data: {
      title: string;
      description: string;
      categoryId: string;
      priority?: Priority;
    },
    user: JwtPayload,
    file?: Express.Multer.File
  ) {
    // 1. Fetch and validate category
    const category = await prisma.category.findUnique({
      where: { id: data.categoryId },
      include: { department: true }
    });

    if (!category || !category.isActive) {
      throw new AppError('The selected category does not exist or is currently inactive.', 400);
    }

    const priority = data.priority || category.defaultPriority || Priority.MEDIUM;
    const now = new Date();
    const slaDueAt = calculateSlaDueDate(now, priority, category.defaultSlaHours);
    const ticketNumber = await generateTicketNumber();

    // 2. Create ticket and initial activity in a transaction
    const ticket = await prisma.$transaction(async (tx) => {
      const created = await tx.ticket.create({
        data: {
          ticketNumber,
          title: data.title.trim(),
          description: data.description.trim(),
          status: TicketStatus.OPEN,
          priority,
          studentId: user.userId,
          categoryId: category.id,
          departmentId: category.departmentId,
          slaDueAt,
          createdAt: now
        }
      });

      // Record Activity
      await tx.ticketActivity.create({
        data: {
          ticketId: created.id,
          actorId: user.userId,
          eventType: ActivityType.CREATED,
          newValue: TicketStatus.OPEN,
          metadata: {
            title: created.title,
            priority: created.priority,
            category: category.name,
            department: category.department.name
          }
        }
      });

      // Optional Attachment
      if (file) {
        await tx.attachment.create({
          data: {
            ticketId: created.id,
            fileName: file.originalname,
            fileUrl: `/uploads/${file.filename}`,
            fileSize: file.size,
            mimeType: file.mimetype,
            uploadedById: user.userId
          }
        });
      }

      return created;
    });

    return this.getTicketById(ticket.id, user);
  }

  async listTickets(
    query: {
      status?: TicketStatus;
      priority?: Priority;
      categoryId?: string;
      departmentId?: string;
      assignedStaffId?: string;
      slaStatus?: string;
      search?: string;
      sortBy?: string;
      sortOrder?: 'asc' | 'desc';
      page?: number;
      limit?: number;
    },
    user: JwtPayload
  ) {
    const page = Math.max(1, query.page || 1);
    const limit = Math.min(100, Math.max(1, query.limit || 10));
    const skip = (page - 1) * limit;

    const where: Prisma.TicketWhereInput = {};

    // 1. Role-based scoping
    if (user.role === Role.STUDENT) {
      where.studentId = user.userId;
    } else if (user.role === Role.STAFF) {
      // If staff filters by department or assigned to me
      if (query.assignedStaffId === 'me') {
        where.assignedStaffId = user.userId;
      } else if (query.assignedStaffId === 'unassigned') {
        where.assignedStaffId = null;
      } else if (query.assignedStaffId) {
        where.assignedStaffId = query.assignedStaffId;
      }
    } else if (user.role === Role.ADMIN) {
      if (query.assignedStaffId === 'unassigned') {
        where.assignedStaffId = null;
      } else if (query.assignedStaffId) {
        where.assignedStaffId = query.assignedStaffId;
      }
    }

    // 2. Query Filters
    if (query.status) {
      where.status = query.status;
    }
    if (query.priority) {
      where.priority = query.priority;
    }
    if (query.categoryId) {
      where.categoryId = query.categoryId;
    }
    if (query.departmentId) {
      where.departmentId = query.departmentId;
    }

    // 3. Search Filter (Ticket Number, Title, Description, or Student Name)
    if (query.search && query.search.trim()) {
      const term = query.search.trim();
      where.OR = [
        { ticketNumber: { contains: term, mode: 'insensitive' } },
        { title: { contains: term, mode: 'insensitive' } },
        { description: { contains: term, mode: 'insensitive' } },
        { student: { name: { contains: term, mode: 'insensitive' } } }
      ];
    }

    // 4. Sort Order
    const sortBy = query.sortBy || 'createdAt';
    const sortOrder = query.sortOrder || 'desc';
    const orderBy: Prisma.TicketOrderByWithRelationInput = {
      [sortBy]: sortOrder
    };

    // 5. Query Count and Data
    const [total, tickets] = await Promise.all([
      prisma.ticket.count({ where }),
      prisma.ticket.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: {
          student: {
            select: { id: true, name: true, email: true, studentIdNumber: true }
          },
          category: {
            select: { id: true, name: true }
          },
          department: {
            select: { id: true, name: true, code: true }
          },
          assignedStaff: {
            select: { id: true, name: true, email: true }
          },
          _count: {
            select: {
              comments: user.role === Role.STUDENT ? { where: { visibility: CommentVisibility.PUBLIC } } : true,
              attachments: true
            }
          }
        }
      })
    ]);

    // 6. Enrich with SLA & Ageing metrics
    let enrichedTickets = tickets.map((t) => {
      const metrics = computeTicketMetrics(t);
      return {
        ...t,
        metrics
      };
    });

    // 7. In-memory filter for slaStatus if requested
    if (query.slaStatus) {
      enrichedTickets = enrichedTickets.filter((t) => t.metrics.slaStatus === query.slaStatus);
    }

    return {
      tickets: enrichedTickets,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  async getTicketById(id: string, user: JwtPayload) {
    const ticket = await prisma.ticket.findUnique({
      where: { id },
      include: {
        student: {
          select: { id: true, name: true, email: true, studentIdNumber: true, phoneNumber: true }
        },
        category: {
          select: { id: true, name: true, description: true }
        },
        department: {
          select: { id: true, name: true, code: true }
        },
        assignedStaff: {
          select: { id: true, name: true, email: true }
        },
        assignedBy: {
          select: { id: true, name: true }
        },
        escalatedBy: {
          select: { id: true, name: true }
        },
        attachments: {
          include: {
            uploadedBy: {
              select: { id: true, name: true, role: true }
            }
          }
        },
        comments: {
          where: user.role === Role.STUDENT ? { visibility: CommentVisibility.PUBLIC } : undefined,
          include: {
            author: {
              select: { id: true, name: true, role: true, email: true }
            }
          },
          orderBy: { createdAt: 'asc' }
        },
        activities: {
          include: {
            actor: {
              select: { id: true, name: true, role: true }
            }
          },
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!ticket) {
      throw new AppError('Ticket not found.', 404);
    }

    // Role-based security: Student can only view their own ticket
    if (user.role === Role.STUDENT && ticket.studentId !== user.userId) {
      throw new AppError('Access denied. You do not have permission to view this ticket.', 403);
    }

    const metrics = computeTicketMetrics(ticket);

    return {
      ...ticket,
      metrics
    };
  }

  async updateStatus(
    id: string,
    data: { status: TicketStatus; resolutionNotes?: string; reason?: string },
    user: JwtPayload
  ) {
    const ticket = await prisma.ticket.findUnique({ where: { id } });
    if (!ticket) throw new AppError('Ticket not found.', 404);

    // Authorization checks
    if (user.role === Role.STUDENT) {
      if (data.status === TicketStatus.CLOSED && ticket.status === TicketStatus.RESOLVED) {
        // Allowed: Student can accept resolution and close
      } else if (data.status === TicketStatus.REOPENED && ticket.status === TicketStatus.RESOLVED) {
        // Allowed: Student can reopen
      } else {
        throw new AppError('Students can only close or reopen a resolved ticket.', 403);
      }
    }

    // State transition validation
    const allowed = VALID_TRANSITIONS[ticket.status];
    if (!allowed.includes(data.status)) {
      throw new AppError(
        `Invalid status transition from '${ticket.status}' to '${data.status}'. Allowed transitions: [${allowed.join(', ')}]`,
        400
      );
    }

    const now = new Date();
    const updateData: Prisma.TicketUpdateInput = {
      status: data.status,
      updatedAt: now
    };

    let eventType: ActivityType = ActivityType.STATUS_CHANGED;
    let metadata: any = { reason: data.reason };

    if (data.status === TicketStatus.RESOLVED) {
      updateData.resolvedAt = now;
      updateData.resolutionNotes = data.resolutionNotes || 'Resolved by staff';
      eventType = ActivityType.RESOLVED;
      metadata.resolutionNotes = updateData.resolutionNotes;
      metadata.withinSla = now.getTime() <= ticket.slaDueAt.getTime();
    } else if (data.status === TicketStatus.CLOSED) {
      updateData.closedAt = now;
      eventType = ActivityType.CLOSED;
    } else if (data.status === TicketStatus.WAITING_FOR_STUDENT) {
      eventType = ActivityType.INFO_REQUESTED;
      metadata.prompt = data.reason || 'Additional information requested by staff.';
    } else if (data.status === TicketStatus.REOPENED) {
      updateData.reopenedAt = now;
      updateData.reopenReason = data.reason || 'Reopened by student';
      eventType = ActivityType.REOPENED;
      metadata.reopenReason = updateData.reopenReason;
    }

    await prisma.$transaction(async (tx) => {
      await tx.ticket.update({
        where: { id },
        data: updateData
      });

      await tx.ticketActivity.create({
        data: {
          ticketId: id,
          actorId: user.userId,
          eventType,
          oldValue: ticket.status,
          newValue: data.status,
          metadata
        }
      });
    });

    return this.getTicketById(id, user);
  }

  async claimTicket(id: string, user: JwtPayload) {
    if (user.role === Role.STUDENT) {
      throw new AppError('Students cannot claim tickets.', 403);
    }

    // Concurrency control: Atomic conditional update
    const result = await prisma.$transaction(async (tx) => {
      const ticket = await tx.ticket.findUnique({
        where: { id },
        select: { id: true, assignedStaffId: true, status: true, ticketNumber: true }
      });

      if (!ticket) {
        throw new AppError('Ticket not found.', 404);
      }

      if (ticket.assignedStaffId && ticket.assignedStaffId !== user.userId) {
        throw new AppError('This ticket has already been claimed or assigned to another staff member.', 409);
      }

      const updated = await tx.ticket.update({
        where: { id },
        data: {
          assignedStaffId: user.userId,
          assignedById: user.userId,
          assignedAt: new Date(),
          status: ticket.status === TicketStatus.OPEN ? TicketStatus.ASSIGNED : ticket.status
        }
      });

      await tx.ticketActivity.create({
        data: {
          ticketId: id,
          actorId: user.userId,
          eventType: ActivityType.ASSIGNED,
          oldValue: 'Unassigned',
          newValue: user.name,
          metadata: { claimed: true }
        }
      });

      return updated;
    });

    return this.getTicketById(result.id, user);
  }

  async assignTicket(id: string, staffId: string, user: JwtPayload) {
    if (user.role !== Role.ADMIN && user.role !== Role.STAFF) {
      throw new AppError('Unauthorized to assign tickets.', 403);
    }

    const staff = await prisma.user.findUnique({
      where: { id: staffId },
      select: { id: true, name: true, role: true, isActive: true }
    });

    if (!staff || !staff.isActive || (staff.role !== Role.STAFF && staff.role !== Role.ADMIN)) {
      throw new AppError('Target assignee is not an active staff member.', 400);
    }

    const ticket = await prisma.ticket.findUnique({
      where: { id },
      include: { assignedStaff: true }
    });

    if (!ticket) throw new AppError('Ticket not found.', 404);

    const oldStaffName = ticket.assignedStaff?.name || 'Unassigned';
    const isReassignment = !!ticket.assignedStaffId;

    await prisma.$transaction(async (tx) => {
      await tx.ticket.update({
        where: { id },
        data: {
          assignedStaffId: staff.id,
          assignedById: user.userId,
          assignedAt: new Date(),
          status: ticket.status === TicketStatus.OPEN ? TicketStatus.ASSIGNED : ticket.status
        }
      });

      await tx.ticketActivity.create({
        data: {
          ticketId: id,
          actorId: user.userId,
          eventType: isReassignment ? ActivityType.REASSIGNED : ActivityType.ASSIGNED,
          oldValue: oldStaffName,
          newValue: staff.name,
          metadata: { assignedBy: user.name }
        }
      });
    });

    return this.getTicketById(id, user);
  }

  async updatePriority(id: string, priority: Priority, reason: string, user: JwtPayload) {
    if (user.role !== Role.ADMIN && user.role !== Role.STAFF) {
      throw new AppError('Unauthorized to alter ticket priority.', 403);
    }

    const ticket = await prisma.ticket.findUnique({ where: { id } });
    if (!ticket) throw new AppError('Ticket not found.', 404);

    if (ticket.priority === priority) {
      return this.getTicketById(id, user);
    }

    // Recalculate SLA due date based on new priority from creation date
    const newDueDate = calculateSlaDueDate(ticket.createdAt, priority);

    await prisma.$transaction(async (tx) => {
      await tx.ticket.update({
        where: { id },
        data: {
          priority,
          slaDueAt: newDueDate
        }
      });

      await tx.ticketActivity.create({
        data: {
          ticketId: id,
          actorId: user.userId,
          eventType: ActivityType.PRIORITY_CHANGED,
          oldValue: ticket.priority,
          newValue: priority,
          metadata: { reason, newSlaDueAt: newDueDate }
        }
      });
    });

    return this.getTicketById(id, user);
  }

  async escalateTicket(id: string, level: EscalationLevel, reason: string, user: JwtPayload) {
    if (user.role !== Role.ADMIN && user.role !== Role.STAFF) {
      throw new AppError('Unauthorized to escalate ticket.', 403);
    }

    const ticket = await prisma.ticket.findUnique({ where: { id } });
    if (!ticket) throw new AppError('Ticket not found.', 404);

    await prisma.$transaction(async (tx) => {
      await tx.ticket.update({
        where: { id },
        data: {
          escalationLevel: level,
          escalatedAt: new Date(),
          escalationReason: reason,
          escalatedById: user.userId
        }
      });

      await tx.ticketActivity.create({
        data: {
          ticketId: id,
          actorId: user.userId,
          eventType: ActivityType.ESCALATED,
          oldValue: ticket.escalationLevel,
          newValue: level,
          metadata: { reason, escalatedBy: user.name }
        }
      });
    });

    return this.getTicketById(id, user);
  }

  async reopenTicket(id: string, reason: string, user: JwtPayload) {
    const ticket = await prisma.ticket.findUnique({ where: { id } });
    if (!ticket) throw new AppError('Ticket not found.', 404);

    if (user.role === Role.STUDENT && ticket.studentId !== user.userId) {
      throw new AppError('Unauthorized.', 403);
    }

    if (ticket.status !== TicketStatus.RESOLVED && ticket.status !== TicketStatus.CLOSED) {
      throw new AppError('Only resolved or closed tickets can be reopened.', 400);
    }

    const now = new Date();

    await prisma.$transaction(async (tx) => {
      await tx.ticket.update({
        where: { id },
        data: {
          status: TicketStatus.REOPENED,
          reopenedAt: now,
          reopenReason: reason
        }
      });

      await tx.ticketActivity.create({
        data: {
          ticketId: id,
          actorId: user.userId,
          eventType: ActivityType.REOPENED,
          oldValue: ticket.status,
          newValue: TicketStatus.REOPENED,
          metadata: { reason }
        }
      });
    });

    return this.getTicketById(id, user);
  }
}

export const ticketService = new TicketService();

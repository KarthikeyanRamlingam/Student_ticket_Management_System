import { prisma } from '../config/prisma';
import { TicketStatus, Priority, Role } from '@prisma/client';
import { computeTicketMetrics } from '../utils/slaCalculator';
import { JwtPayload } from '../types';

export class AnalyticsService {
  async getStudentAnalytics(user: JwtPayload) {
    const summarySelect = {
      id: true,
      ticketNumber: true,
      title: true,
      status: true,
      priority: true,
      createdAt: true,
      updatedAt: true,
      slaDueAt: true,
      resolvedAt: true,
      category: { select: { name: true } },
      department: { select: { name: true, code: true } },
      assignedStaff: { select: { name: true } }
    } as const;

    const [statusGroups, actionRows, recentRows] = await Promise.all([
      prisma.ticket.groupBy({
        by: ['status'],
        where: { studentId: user.userId },
        _count: { _all: true }
      }),
      prisma.ticket.findMany({
        where: { studentId: user.userId, status: TicketStatus.WAITING_FOR_STUDENT },
        select: summarySelect,
        orderBy: { updatedAt: 'desc' },
        take: 5
      }),
      prisma.ticket.findMany({
        where: { studentId: user.userId },
        select: summarySelect,
        orderBy: { createdAt: 'desc' },
        take: 5
      })
    ]);

    const counts = new Map(statusGroups.map((row) => [row.status, row._count._all]));
    const count = (status: TicketStatus) => counts.get(status) || 0;
    const total = statusGroups.reduce((sum, row) => sum + row._count._all, 0);
    const open = count(TicketStatus.OPEN);
    const inProgress = count(TicketStatus.IN_PROGRESS) + count(TicketStatus.ASSIGNED) + count(TicketStatus.REOPENED);
    const waitingForMe = count(TicketStatus.WAITING_FOR_STUDENT);
    const resolved = count(TicketStatus.RESOLVED) + count(TicketStatus.CLOSED);
    const actionRequired = actionRows.map((ticket) => ({ ...ticket, metrics: computeTicketMetrics(ticket) }));
    const recentTickets = recentRows.map((ticket) => ({ ...ticket, metrics: computeTicketMetrics(ticket) }));

    return {
      cards: {
        total,
        totalTickets: total,
        open,
        inProgress,
        activeTickets: open + inProgress,
        waitingForMe,
        waitingForStudent: waitingForMe,
        resolved,
        resolvedTickets: resolved
      },
      actionRequired,
      recentTickets
    };
  }

  async getStaffAnalytics(user: JwtPayload) {
    const activeStatuses = [TicketStatus.OPEN, TicketStatus.ASSIGNED, TicketStatus.IN_PROGRESS, TicketStatus.WAITING_FOR_STUDENT, TicketStatus.REOPENED];
    const ticketSelect = {
      id: true,
      ticketNumber: true,
      title: true,
      status: true,
      priority: true,
      createdAt: true,
      updatedAt: true,
      slaDueAt: true,
      resolvedAt: true,
      category: { select: { name: true } },
      department: { select: { name: true, code: true } },
      student: { select: { name: true, studentIdNumber: true } }
    } as const;
    const assignedWhere = { assignedStaffId: user.userId };
    const now = new Date();
    const departmentScope = user.departmentId ? { departmentId: user.departmentId } : {};

    const [statusGroups, dueSoon, overdue, unassignedCount, urgentRows, recentRows] = await Promise.all([
      prisma.ticket.groupBy({ by: ['status'], where: assignedWhere, _count: { _all: true } }),
      prisma.ticket.count({
        where: {
          ...assignedWhere,
          status: { in: activeStatuses },
          slaDueAt: { gte: now },
          OR: [
            { priority: Priority.URGENT, slaDueAt: { lte: new Date(now.getTime() + 2 * 60 * 60 * 1000) } },
            { priority: Priority.HIGH, slaDueAt: { lte: new Date(now.getTime() + 6 * 60 * 60 * 1000) } },
            { priority: Priority.MEDIUM, slaDueAt: { lte: new Date(now.getTime() + 12 * 60 * 60 * 1000) } },
            { priority: Priority.LOW, slaDueAt: { lte: new Date(now.getTime() + 18 * 60 * 60 * 1000) } }
          ]
        }
      }),
      prisma.ticket.count({ where: { ...assignedWhere, status: { in: activeStatuses }, slaDueAt: { lt: now } } }),
      prisma.ticket.count({ where: { ...departmentScope, assignedStaffId: null, status: { in: [TicketStatus.OPEN, TicketStatus.REOPENED] } } }),
      prisma.ticket.findMany({
        where: { ...assignedWhere, status: { in: activeStatuses }, OR: [{ priority: { in: [Priority.URGENT, Priority.HIGH] } }, { slaDueAt: { lt: new Date(now.getTime() + 18 * 60 * 60 * 1000) } }] },
        select: ticketSelect,
        orderBy: [{ slaDueAt: 'asc' }, { priority: 'desc' }],
        take: 6
      }),
      prisma.ticket.findMany({ where: assignedWhere, select: ticketSelect, orderBy: { updatedAt: 'desc' }, take: 8 })
    ]);

    const counts = new Map(statusGroups.map((row) => [row.status, row._count._all]));
    const count = (status: TicketStatus) => counts.get(status) || 0;
    const assignedToMe = activeStatuses.reduce((sum, status) => sum + count(status), 0);
    const inProgress = count(TicketStatus.IN_PROGRESS);
    const waitingForStudent = count(TicketStatus.WAITING_FOR_STUDENT);
    const resolvedCount = count(TicketStatus.RESOLVED) + count(TicketStatus.CLOSED);
    const urgentQueue = urgentRows.map((ticket) => ({ ...ticket, metrics: computeTicketMetrics(ticket) }));
    const recentAssigned = recentRows.map((ticket) => ({ ...ticket, metrics: computeTicketMetrics(ticket) }));

    return {
      cards: {
        assignedToMe,
        inProgress,
        activeTickets: assignedToMe,
        waitingForStudent,
        dueSoon,
        overdue,
        urgentTickets: dueSoon + overdue,
        openInDepartment: unassignedCount,
        unassignedCount,
        resolvedThisWeek: resolvedCount,
        resolvedTickets: resolvedCount
      },
      urgentQueue,
      urgentTicketsList: urgentQueue,
      recentAssigned
    };
  }

  async getAdminAnalytics() {
    // Analytics needs a narrow projection; avoid transferring large ticket
    // descriptions and resolution notes from Postgres on every dashboard load.
    const allTickets = await prisma.ticket.findMany({
      select: {
        id: true,
        ticketNumber: true,
        title: true,
        status: true,
        priority: true,
        createdAt: true,
        updatedAt: true,
        slaDueAt: true,
        resolvedAt: true,
        assignedStaffId: true,
        category: { select: { id: true, name: true } },
        department: { select: { id: true, name: true, code: true } },
        student: { select: { id: true, name: true } },
        assignedStaff: { select: { id: true, name: true } }
      }
    });

    const enriched = allTickets.map((t) => ({
      ...t,
      metrics: computeTicketMetrics(t)
    }));

    const total = enriched.length;
    const openTickets = enriched.filter((t) => t.status !== TicketStatus.RESOLVED && t.status !== TicketStatus.CLOSED);
    const resolvedTickets = enriched.filter((t) => t.status === TicketStatus.RESOLVED || t.status === TicketStatus.CLOSED);

    const openCount = openTickets.length;
    const resolvedCount = resolvedTickets.length;
    const overdueCount = openTickets.filter((t) => t.metrics.isOverdue).length;
    const unassignedCount = openTickets.filter((t) => !t.assignedStaffId).length;

    // SLA Compliance %
    const resolvedWithinSla = resolvedTickets.filter((t) => t.metrics.slaStatus === 'MET').length;
    const slaComplianceRate = resolvedTickets.length > 0
      ? Math.round((resolvedWithinSla / resolvedTickets.length) * 100)
      : 100;

    // Average Resolution Time (in hours)
    let totalResolutionHours = 0;
    let resolvedWithDurationCount = 0;
    resolvedTickets.forEach((t) => {
      if (t.resolvedAt) {
        const hours = (new Date(t.resolvedAt).getTime() - new Date(t.createdAt).getTime()) / (1000 * 3600);
        if (hours >= 0) {
          totalResolutionHours += hours;
          resolvedWithDurationCount++;
        }
      }
    });
    const avgResolutionHours = resolvedWithDurationCount > 0
      ? parseFloat((totalResolutionHours / resolvedWithDurationCount).toFixed(1))
      : 0;

    // Charts: Tickets by Category
    const categoryMap: Record<string, number> = {};
    enriched.forEach((t) => {
      const cat = t.category.name;
      categoryMap[cat] = (categoryMap[cat] || 0) + 1;
    });
    const byCategory = Object.entries(categoryMap).map(([name, count]) => ({
      name,
      value: count,
      count
    }));

    // Charts: Tickets by Department
    const deptMap: Record<string, number> = {};
    enriched.forEach((t) => {
      const dName = t.department?.name || 'General';
      deptMap[dName] = (deptMap[dName] || 0) + 1;
    });
    const byDepartment = Object.entries(deptMap).map(([name, count]) => ({
      name,
      value: count,
      count
    }));

    // Charts: Tickets by Status
    const statusMap: Record<string, number> = {};
    Object.values(TicketStatus).forEach((st) => (statusMap[st] = 0));
    enriched.forEach((t) => {
      statusMap[t.status] = (statusMap[t.status] || 0) + 1;
    });
    const byStatus = Object.entries(statusMap).map(([status, count]) => ({
      name: status,
      status,
      value: count,
      count
    }));

    // Charts: Tickets by Priority
    const priorityMap: Record<string, number> = {};
    Object.values(Priority).forEach((p) => (priorityMap[p] = 0));
    enriched.forEach((t) => {
      priorityMap[t.priority] = (priorityMap[t.priority] || 0) + 1;
    });
    const byPriority = Object.entries(priorityMap).map(([priority, count]) => ({
      name: priority,
      priority,
      value: count,
      count
    }));

    // Charts: Ageing Distribution for open tickets
    const ageingMap: Record<string, number> = {
      '0–1 Days': 0,
      '2–3 Days': 0,
      '4–7 Days': 0,
      '8+ Days': 0
    };
    openTickets.forEach((t) => {
      if (t.metrics.ageingBucket === '0_1_DAYS') ageingMap['0–1 Days']++;
      else if (t.metrics.ageingBucket === '2_3_DAYS') ageingMap['2–3 Days']++;
      else if (t.metrics.ageingBucket === '4_7_DAYS') ageingMap['4–7 Days']++;
      else ageingMap['8+ Days']++;
    });
    const ageingDistribution = Object.entries(ageingMap).map(([bucket, count]) => ({
      name: bucket,
      bucket,
      value: count,
      count
    }));

    // Charts: Staff Workload
    const staffList = await prisma.user.findMany({
      where: { role: { in: [Role.STAFF, Role.ADMIN] }, isActive: true },
      select: { id: true, name: true, department: { select: { code: true } } }
    });

    const staffWorkload = staffList.map((st) => {
      const staffTickets = enriched.filter((t) => t.assignedStaffId === st.id);
      const active = staffTickets.filter((t) => t.status !== TicketStatus.RESOLVED && t.status !== TicketStatus.CLOSED).length;
      const done = staffTickets.filter((t) => t.status === TicketStatus.RESOLVED || t.status === TicketStatus.CLOSED).length;
      const overdue = staffTickets.filter((t) => t.metrics.isOverdue && t.status !== TicketStatus.RESOLVED && t.status !== TicketStatus.CLOSED).length;
      return {
        id: st.id,
        name: st.name,
        dept: st.department?.code || 'ADMIN',
        active,
        done,
        overdue,
        total: staffTickets.length,
        value: staffTickets.length
      };
    });

    // Oldest unresolved tickets
    const oldestUnresolved = [...openTickets]
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
      .slice(0, 5);

    // SLA Breaches / Urgent tickets list
    const slaBreaches = enriched
      .filter((t) => t.metrics.slaStatus === 'OVERDUE' || t.metrics.slaStatus === 'BREACHED')
      .slice(0, 6);

    return {
      cards: {
        total,
        totalTickets: total,
        open: openCount,
        activeTickets: openCount,
        resolved: resolvedCount,
        resolvedTickets: resolvedCount,
        overdue: overdueCount,
        breachedTickets: overdueCount,
        unassigned: unassignedCount,
        unassignedTickets: unassignedCount,
        slaComplianceRate,
        avgResolutionHours
      },
      charts: {
        byCategory,
        byDepartment,
        byStatus,
        byPriority,
        ageingDistribution,
        staffWorkload
      },
      oldestUnresolved,
      slaBreaches,
      urgentTicketsList: slaBreaches
    };
  }
}

export const analyticsService = new AnalyticsService();

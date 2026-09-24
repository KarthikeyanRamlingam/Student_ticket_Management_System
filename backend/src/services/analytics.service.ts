import { prisma } from '../config/prisma';
import { TicketStatus, Priority, Role } from '@prisma/client';
import { computeTicketMetrics } from '../utils/slaCalculator';
import { JwtPayload } from '../types';

export class AnalyticsService {
  async getStudentAnalytics(user: JwtPayload) {
    const tickets = await prisma.ticket.findMany({
      where: { studentId: user.userId },
      include: {
        category: { select: { name: true } },
        department: { select: { name: true, code: true } },
        assignedStaff: { select: { name: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    const enriched = tickets.map((t) => ({ ...t, metrics: computeTicketMetrics(t) }));

    const total = enriched.length;
    const open = enriched.filter((t) => t.status === TicketStatus.OPEN).length;
    const inProgress = enriched.filter((t) => t.status === TicketStatus.IN_PROGRESS || t.status === TicketStatus.ASSIGNED || t.status === TicketStatus.REOPENED).length;
    const waitingForMe = enriched.filter((t) => t.status === TicketStatus.WAITING_FOR_STUDENT).length;
    const resolved = enriched.filter((t) => t.status === TicketStatus.RESOLVED || t.status === TicketStatus.CLOSED).length;

    const actionRequired = enriched.filter((t) => t.status === TicketStatus.WAITING_FOR_STUDENT);
    const recentTickets = enriched.slice(0, 5);

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
    // Staff's assigned tickets + unassigned department tickets
    const myTickets = await prisma.ticket.findMany({
      where: { assignedStaffId: user.userId },
      include: {
        category: { select: { name: true } },
        department: { select: { name: true, code: true } },
        student: { select: { name: true, studentIdNumber: true } }
      },
      orderBy: { slaDueAt: 'asc' }
    });

    const enrichedMyTickets = myTickets.map((t) => ({ ...t, metrics: computeTicketMetrics(t) }));

    const assignedToMe = enrichedMyTickets.filter((t) => t.status !== TicketStatus.RESOLVED && t.status !== TicketStatus.CLOSED).length;
    const inProgress = enrichedMyTickets.filter((t) => t.status === TicketStatus.IN_PROGRESS).length;
    const waitingForStudent = enrichedMyTickets.filter((t) => t.status === TicketStatus.WAITING_FOR_STUDENT).length;
    const dueSoon = enrichedMyTickets.filter((t) => t.metrics.isDueSoon && t.status !== TicketStatus.RESOLVED && t.status !== TicketStatus.CLOSED).length;
    const overdue = enrichedMyTickets.filter((t) => t.metrics.isOverdue && t.status !== TicketStatus.RESOLVED && t.status !== TicketStatus.CLOSED).length;

    // Unassigned tickets in queue
    const unassignedCount = await prisma.ticket.count({
      where: {
        assignedStaffId: null,
        status: { in: [TicketStatus.OPEN, TicketStatus.REOPENED] }
      }
    });

    // Resolved count
    const resolvedCount = enrichedMyTickets.filter((t) => t.status === TicketStatus.RESOLVED || t.status === TicketStatus.CLOSED).length;

    // Urgent queue (high priority / urgent or due soon)
    const urgentQueue = enrichedMyTickets
      .filter((t) => t.status !== TicketStatus.RESOLVED && t.status !== TicketStatus.CLOSED && (t.priority === Priority.URGENT || t.priority === Priority.HIGH || t.metrics.isDueSoon || t.metrics.isOverdue))
      .slice(0, 6);

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
      recentAssigned: enrichedMyTickets.slice(0, 8)
    };
  }

  async getAdminAnalytics() {
    const allTickets = await prisma.ticket.findMany({
      include: {
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

import request from 'supertest';
import app from '../src/app';
import { Priority, TicketStatus } from '@prisma/client';
import { calculateSlaDueDate, computeTicketMetrics, DEFAULT_SLA_HOURS } from '../src/utils/slaCalculator';
import { VALID_TRANSITIONS } from '../src/services/ticket.service';

describe('SLA Calculator and Metrics Logic', () => {
  test('should return correct default SLA hours for each priority', () => {
    expect(DEFAULT_SLA_HOURS[Priority.URGENT].resolutionHours).toBe(8);
    expect(DEFAULT_SLA_HOURS[Priority.HIGH].resolutionHours).toBe(24);
    expect(DEFAULT_SLA_HOURS[Priority.MEDIUM].resolutionHours).toBe(48);
    expect(DEFAULT_SLA_HOURS[Priority.LOW].resolutionHours).toBe(72);
  });

  test('should accurately calculate SLA due date from creation time', () => {
    const base = new Date('2026-09-01T10:00:00Z');
    const urgentDue = calculateSlaDueDate(base, Priority.URGENT);
    const expectedUrgent = new Date('2026-09-01T18:00:00Z');
    expect(urgentDue.getTime()).toBe(expectedUrgent.getTime());

    const highDue = calculateSlaDueDate(base, Priority.HIGH);
    const expectedHigh = new Date('2026-09-02T10:00:00Z');
    expect(highDue.getTime()).toBe(expectedHigh.getTime());
  });

  test('should correctly flag overdue tickets when deadline has passed', () => {
    const pastCreated = new Date(Date.now() - 30 * 3600 * 1000); // 30 hours ago
    const pastDue = new Date(Date.now() - 6 * 3600 * 1000); // due 6 hours ago

    const metrics = computeTicketMetrics({
      createdAt: pastCreated,
      slaDueAt: pastDue,
      status: TicketStatus.IN_PROGRESS,
      priority: Priority.HIGH
    });

    expect(metrics.slaStatus).toBe('OVERDUE');
    expect(metrics.isOverdue).toBe(true);
    expect(metrics.hoursRemaining).toBeLessThan(0);
  });

  test('should flag resolved tickets as MET or BREACHED accurately', () => {
    const created = new Date('2026-09-01T10:00:00Z');
    const due = new Date('2026-09-02T10:00:00Z'); // 24h SLA

    // Resolved in 12 hours -> MET
    const resolvedInTime = new Date('2026-09-01T22:00:00Z');
    const metMetrics = computeTicketMetrics({
      createdAt: created,
      slaDueAt: due,
      resolvedAt: resolvedInTime,
      status: TicketStatus.RESOLVED,
      priority: Priority.HIGH
    });
    expect(metMetrics.slaStatus).toBe('MET');
    expect(metMetrics.isBreached).toBe(false);

    // Resolved in 30 hours -> BREACHED
    const resolvedLate = new Date('2026-09-02T16:00:00Z');
    const breachedMetrics = computeTicketMetrics({
      createdAt: created,
      slaDueAt: due,
      resolvedAt: resolvedLate,
      status: TicketStatus.RESOLVED,
      priority: Priority.HIGH
    });
    expect(breachedMetrics.slaStatus).toBe('BREACHED');
    expect(breachedMetrics.isBreached).toBe(true);
  });

  test('should categorize ageing buckets properly', () => {
    const now = Date.now();
    const day = 24 * 3600 * 1000;

    const ticket0Days = computeTicketMetrics({
      createdAt: new Date(now - 0.5 * day),
      slaDueAt: new Date(now + 2 * day),
      status: TicketStatus.OPEN,
      priority: Priority.MEDIUM
    });
    expect(ticket0Days.ageingBucket).toBe('0_1_DAYS');

    const ticket3Days = computeTicketMetrics({
      createdAt: new Date(now - 2.5 * day),
      slaDueAt: new Date(now - 0.5 * day),
      status: TicketStatus.OPEN,
      priority: Priority.MEDIUM
    });
    expect(ticket3Days.ageingBucket).toBe('2_3_DAYS');

    const ticket5Days = computeTicketMetrics({
      createdAt: new Date(now - 5 * day),
      slaDueAt: new Date(now - 3 * day),
      status: TicketStatus.OPEN,
      priority: Priority.MEDIUM
    });
    expect(ticket5Days.ageingBucket).toBe('4_7_DAYS');

    const ticket10Days = computeTicketMetrics({
      createdAt: new Date(now - 10 * day),
      slaDueAt: new Date(now - 8 * day),
      status: TicketStatus.OPEN,
      priority: Priority.MEDIUM
    });
    expect(ticket10Days.ageingBucket).toBe('8_PLUS_DAYS');
  });
});

describe('Ticket State Machine Validation Rules', () => {
  test('should permit valid transitions', () => {
    expect(VALID_TRANSITIONS[TicketStatus.OPEN]).toContain(TicketStatus.IN_PROGRESS);
    expect(VALID_TRANSITIONS[TicketStatus.IN_PROGRESS]).toContain(TicketStatus.WAITING_FOR_STUDENT);
    expect(VALID_TRANSITIONS[TicketStatus.WAITING_FOR_STUDENT]).toContain(TicketStatus.IN_PROGRESS);
    expect(VALID_TRANSITIONS[TicketStatus.IN_PROGRESS]).toContain(TicketStatus.RESOLVED);
    expect(VALID_TRANSITIONS[TicketStatus.RESOLVED]).toContain(TicketStatus.CLOSED);
    expect(VALID_TRANSITIONS[TicketStatus.RESOLVED]).toContain(TicketStatus.REOPENED);
    expect(VALID_TRANSITIONS[TicketStatus.REOPENED]).toContain(TicketStatus.IN_PROGRESS);
  });

  test('should reject invalid transitions', () => {
    expect(VALID_TRANSITIONS[TicketStatus.OPEN]).not.toContain(TicketStatus.CLOSED);
    expect(VALID_TRANSITIONS[TicketStatus.OPEN]).not.toContain(TicketStatus.REOPENED);
    expect(VALID_TRANSITIONS[TicketStatus.CLOSED]).toHaveLength(0);
    expect(VALID_TRANSITIONS[TicketStatus.RESOLVED]).not.toContain(TicketStatus.OPEN);
  });
});

describe('Integration Security and Privacy API Tests', () => {
  let studentToken: string;
  let adminToken: string;

  beforeAll(async () => {
    const studentLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: 'student@campusresolve.demo', password: 'Student@123' });
    studentToken = studentLogin.body.data.token;

    const adminLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@campusresolve.demo', password: 'Admin@123' });
    adminToken = adminLogin.body.data.token;
  });

  test('Health check should return 200 OK', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  test('Student cannot access Admin Analytics (Role-based authorization 403)', async () => {
    const res = await request(app)
      .get('/api/analytics/admin')
      .set('Authorization', `Bearer ${studentToken}`);
    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
  });

  test('Admin can access Admin Analytics with 200 OK', async () => {
    const res = await request(app)
      .get('/api/analytics/admin')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.cards).toBeDefined();
    expect(res.body.data.cards.total).toBeGreaterThan(0);
  });

  test('Student cannot post an INTERNAL note (Comment Privacy 403)', async () => {
    // Student Aarav's ticket
    const ticketsRes = await request(app)
      .get('/api/tickets')
      .set('Authorization', `Bearer ${studentToken}`);

    const ticketId = ticketsRes.body.data[0].id;

    const res = await request(app)
      .post(`/api/tickets/${ticketId}/comments`)
      .set('Authorization', `Bearer ${studentToken}`)
      .send({
        message: 'Attempting to post internal note as student',
        visibility: 'INTERNAL'
      });

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
  });
});

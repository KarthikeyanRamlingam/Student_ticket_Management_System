import { PrismaClient, Role, TicketStatus, Priority, EscalationLevel, CommentVisibility, ActivityType } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Clean existing data in reverse dependency order
  await prisma.attachment.deleteMany();
  await prisma.ticketActivity.deleteMany();
  await prisma.ticketComment.deleteMany();
  await prisma.ticket.deleteMany();
  await prisma.category.deleteMany();
  await prisma.slaPolicy.deleteMany();
  await prisma.user.deleteMany();
  await prisma.department.deleteMany();

  // 1. Seed SLA Policies
  console.log('Seeding SLA policies...');
  await prisma.slaPolicy.createMany({
    data: [
      { priority: Priority.URGENT, resolutionHours: 8, warningHours: 2, description: 'Critical blockers, server down, urgent exam issues' },
      { priority: Priority.HIGH, resolutionHours: 24, warningHours: 6, description: 'Time-sensitive requests, fee deadlines, hall tickets' },
      { priority: Priority.MEDIUM, resolutionHours: 48, warningHours: 12, description: 'Standard requests, attendance appeals, hostel requests' },
      { priority: Priority.LOW, resolutionHours: 72, warningHours: 18, description: 'General inquiries, duplicate ID cards, bonafide certificates' }
    ]
  });

  // 2. Seed Departments
  console.log('Seeding Departments...');
  const finDept = await prisma.department.create({
    data: { name: 'Finance & Accounts', code: 'FIN', description: 'Handles tuition fees, scholarships, refunds, and receipts' }
  });
  const acadDept = await prisma.department.create({
    data: { name: 'Academic & Examination Affairs', code: 'ACAD', description: 'Handles attendance, hall tickets, grade sheets, and exam queries' }
  });
  const itDept = await prisma.department.create({
    data: { name: 'Information Technology Services', code: 'IT', description: 'Handles LMS, campus Wi-Fi, portal login, and hardware support' }
  });
  const hostelDept = await prisma.department.create({
    data: { name: 'Student Welfare & Hostel', code: 'HOSTEL', description: 'Hostel allotment, mess issues, sports, and campus transport' }
  });
  const adminDept = await prisma.department.create({
    data: { name: 'General Administration', code: 'ADMIN', description: 'ID cards, official documents, bonafide letters, and visitor passes' }
  });

  // 3. Seed Categories
  console.log('Seeding Categories...');
  const catFees = await prisma.category.create({
    data: { name: 'Fees & Payment', description: 'Tuition fees, dues, fee receipts, payment gateway errors', departmentId: finDept.id, defaultPriority: Priority.HIGH, defaultSlaHours: 24 }
  });
  const catScholarship = await prisma.category.create({
    data: { name: 'Scholarships & Concessions', description: 'Merit-cum-means, state scholarships, fee waivers', departmentId: finDept.id, defaultPriority: Priority.MEDIUM, defaultSlaHours: 48 }
  });
  const catAttendance = await prisma.category.create({
    data: { name: 'Attendance Discrepancy', description: 'Medical leaves, condonation, attendance portal corrections', departmentId: acadDept.id, defaultPriority: Priority.MEDIUM, defaultSlaHours: 48 }
  });
  const catExams = await prisma.category.create({
    data: { name: 'Examination & Results', description: 'Hall tickets, re-evaluation, grade cards, timetable clashes', departmentId: acadDept.id, defaultPriority: Priority.HIGH, defaultSlaHours: 24 }
  });
  const catCertificates = await prisma.category.create({
    data: { name: 'Certificates & Transcripts', description: 'Bonafide certificate, provisional degree, transcript verification', departmentId: acadDept.id, defaultPriority: Priority.LOW, defaultSlaHours: 72 }
  });
  const catIdCard = await prisma.category.create({
    data: { name: 'ID Card Services', description: 'Lost card, replacement, RFID chip activation', departmentId: adminDept.id, defaultPriority: Priority.LOW, defaultSlaHours: 72 }
  });
  const catHostel = await prisma.category.create({
    data: { name: 'Hostel Maintenance', description: 'Room allotment, plumbing, electricity, mess food quality', departmentId: hostelDept.id, defaultPriority: Priority.MEDIUM, defaultSlaHours: 48 }
  });
  const catTransport = await prisma.category.create({
    data: { name: 'Campus Transport', description: 'Bus pass, route timings, driver grievances', departmentId: hostelDept.id, defaultPriority: Priority.LOW, defaultSlaHours: 72 }
  });
  const catTechSupport = await prisma.category.create({
    data: { name: 'Technical Support', description: 'Portal login failure, Wi-Fi credentials, LMS access, lab equipment', departmentId: itDept.id, defaultPriority: Priority.URGENT, defaultSlaHours: 8 }
  });
  const catOther = await prisma.category.create({
    data: { name: 'General Inquiries', description: 'Miscellaneous campus requests not covered elsewhere', departmentId: adminDept.id, defaultPriority: Priority.MEDIUM, defaultSlaHours: 48 }
  });

  // 4. Seed Users
  console.log('Seeding Users...');
  const salt = await bcrypt.genSalt(10);
  const adminPassword = await bcrypt.hash('Admin@123', salt);
  const staffPassword = await bcrypt.hash('Staff@123', salt);
  const studentPassword = await bcrypt.hash('Student@123', salt);

  // Admin
  const adminUser = await prisma.user.create({
    data: {
      name: 'Dr. Rajesh Sharma (Dean of Students)',
      email: 'admin@campusresolve.demo',
      password: adminPassword,
      role: Role.ADMIN,
      departmentId: adminDept.id,
      phoneNumber: '+91 9876543210'
    }
  });

  // Staff Members
  const staffFinance = await prisma.user.create({
    data: {
      name: 'Priya Sharma',
      email: 'staff@campusresolve.demo',
      password: staffPassword,
      role: Role.STAFF,
      departmentId: finDept.id,
      phoneNumber: '+91 9876543211'
    }
  });

  const staffTech = await prisma.user.create({
    data: {
      name: 'Rahul Verma',
      email: 'staff.it@campusresolve.demo',
      password: staffPassword,
      role: Role.STAFF,
      departmentId: itDept.id,
      phoneNumber: '+91 9876543212'
    }
  });

  const staffAcad = await prisma.user.create({
    data: {
      name: 'Anjali Nair',
      email: 'staff.acad@campusresolve.demo',
      password: staffPassword,
      role: Role.STAFF,
      departmentId: acadDept.id,
      phoneNumber: '+91 9876543213'
    }
  });

  const staffHostel = await prisma.user.create({
    data: {
      name: 'Vikram Singh',
      email: 'staff.hostel@campusresolve.demo',
      password: staffPassword,
      role: Role.STAFF,
      departmentId: hostelDept.id,
      phoneNumber: '+91 9876543214'
    }
  });

  // Students
  const studentAarav = await prisma.user.create({
    data: {
      name: 'Aarav Patel',
      email: 'student@campusresolve.demo',
      password: studentPassword,
      role: Role.STUDENT,
      studentIdNumber: 'STU-2024-001',
      phoneNumber: '+91 9811122233'
    }
  });

  const studentSneha = await prisma.user.create({
    data: {
      name: 'Sneha Kulkarni',
      email: 'student2@campusresolve.demo',
      password: studentPassword,
      role: Role.STUDENT,
      studentIdNumber: 'STU-2024-045',
      phoneNumber: '+91 9811122244'
    }
  });

  const studentRohan = await prisma.user.create({
    data: {
      name: 'Rohan Gupta',
      email: 'student3@campusresolve.demo',
      password: studentPassword,
      role: Role.STUDENT,
      studentIdNumber: 'STU-2024-112',
      phoneNumber: '+91 9811122255'
    }
  });

  // 5. Seed 21 Diverse Tickets with Realistic Scenarios & Timelines
  console.log('Seeding Tickets & Activities...');
  const now = new Date();
  const hoursAgo = (h: number) => new Date(now.getTime() - h * 3600 * 1000);
  const hoursFrom = (base: Date, h: number) => new Date(base.getTime() + h * 3600 * 1000);

  // TICKET 1: OVERDUE Ticket (Created 3 days ago, 24h SLA, unattended)
  const t1Created = hoursAgo(72);
  const t1Sla = hoursFrom(t1Created, 24);
  const t1 = await prisma.ticket.create({
    data: {
      ticketNumber: 'TKT-2026-00001',
      title: 'Tuition Fee Payment Debited Twice from Bank Account',
      description: 'On 21st Sep, I attempted to pay semester tuition fees of INR 45,000 via NetBanking. The amount got debited twice (TxnRef: TXN99881 and TXN99882) but the student dashboard still marks fee as pending.',
      status: TicketStatus.IN_PROGRESS,
      priority: Priority.HIGH,
      studentId: studentAarav.id,
      categoryId: catFees.id,
      departmentId: finDept.id,
      assignedStaffId: staffFinance.id,
      assignedById: adminUser.id,
      assignedAt: hoursAgo(65),
      createdAt: t1Created,
      slaDueAt: t1Sla,
      escalationLevel: EscalationLevel.LEVEL_1,
      escalatedAt: hoursAgo(30),
      escalationReason: 'SLA Breached by > 24 hours without resolution',
      escalatedById: adminUser.id
    }
  });

  await prisma.ticketActivity.createMany({
    data: [
      { ticketId: t1.id, actorId: studentAarav.id, eventType: ActivityType.CREATED, newValue: 'OPEN', createdAt: t1Created },
      { ticketId: t1.id, actorId: adminUser.id, eventType: ActivityType.ASSIGNED, newValue: staffFinance.name, createdAt: hoursAgo(65) },
      { ticketId: t1.id, actorId: staffFinance.id, eventType: ActivityType.STATUS_CHANGED, oldValue: 'ASSIGNED', newValue: 'IN_PROGRESS', createdAt: hoursAgo(60) },
      { ticketId: t1.id, actorId: adminUser.id, eventType: ActivityType.ESCALATED, oldValue: 'NONE', newValue: 'LEVEL_1', metadata: { reason: 'SLA Breached' }, createdAt: hoursAgo(30) }
    ]
  });

  await prisma.ticketComment.createMany({
    data: [
      { ticketId: t1.id, authorId: staffFinance.id, message: 'We have initiated reconciliation with HDFC merchant gateway. Expected refund cycle is 3-5 working days.', visibility: CommentVisibility.PUBLIC, createdAt: hoursAgo(55) },
      { ticketId: t1.id, authorId: staffFinance.id, message: 'Bank reconciliation batch file has not been received from gateway yet. Escalated to finance manager.', visibility: CommentVisibility.INTERNAL, createdAt: hoursAgo(32) }
    ]
  });

  // TICKET 2: URGENT Ticket (Portal Down - Approaching SLA, 8h SLA created 6h ago)
  const t2Created = hoursAgo(6);
  const t2Sla = hoursFrom(t2Created, 8); // Due in 2 hours -> DUE_SOON
  const t2 = await prisma.ticket.create({
    data: {
      ticketNumber: 'TKT-2026-00002',
      title: 'LMS Portal Login Error During Mid-Term Online Quiz',
      description: 'Unable to login to Moodle/LMS portal. Error "Invalid OAuth Token (500)" is displayed for CS302 quiz which concludes at 11 PM today. Need emergency bypass.',
      status: TicketStatus.IN_PROGRESS,
      priority: Priority.URGENT,
      studentId: studentSneha.id,
      categoryId: catTechSupport.id,
      departmentId: itDept.id,
      assignedStaffId: staffTech.id,
      assignedById: staffTech.id,
      assignedAt: hoursAgo(5),
      createdAt: t2Created,
      slaDueAt: t2Sla
    }
  });

  await prisma.ticketActivity.createMany({
    data: [
      { ticketId: t2.id, actorId: studentSneha.id, eventType: ActivityType.CREATED, newValue: 'OPEN', createdAt: t2Created },
      { ticketId: t2.id, actorId: staffTech.id, eventType: ActivityType.ASSIGNED, newValue: staffTech.name, metadata: { claimed: true }, createdAt: hoursAgo(5) },
      { ticketId: t2.id, actorId: staffTech.id, eventType: ActivityType.STATUS_CHANGED, oldValue: 'ASSIGNED', newValue: 'IN_PROGRESS', createdAt: hoursAgo(5) }
    ]
  });

  await prisma.ticketComment.createMany({
    data: [
      { ticketId: t2.id, authorId: staffTech.id, message: 'Investigating Redis session cache cluster on the primary auth server.', visibility: CommentVisibility.INTERNAL, createdAt: hoursAgo(4) },
      { ticketId: t2.id, authorId: staffTech.id, message: 'We have cleared the session cache lock for your user ID. Please retry logging in via an incognito window.', visibility: CommentVisibility.PUBLIC, createdAt: hoursAgo(3) }
    ]
  });

  // TICKET 3: WAITING_FOR_STUDENT (Staff requested document/receipt)
  const t3Created = hoursAgo(20);
  const t3Sla = hoursFrom(t3Created, 48);
  const t3 = await prisma.ticket.create({
    data: {
      ticketNumber: 'TKT-2026-00003',
      title: 'Attendance shortage appeal due to Dengue hospitalization',
      description: 'My attendance in Digital Signal Processing (EC401) is currently 68% due to hospitalization from 5th to 14th August. Requesting condonation approval.',
      status: TicketStatus.WAITING_FOR_STUDENT,
      priority: Priority.MEDIUM,
      studentId: studentRohan.id,
      categoryId: catAttendance.id,
      departmentId: acadDept.id,
      assignedStaffId: staffAcad.id,
      assignedById: staffAcad.id,
      assignedAt: hoursAgo(18),
      createdAt: t3Created,
      slaDueAt: t3Sla
    }
  });

  await prisma.ticketActivity.createMany({
    data: [
      { ticketId: t3.id, actorId: studentRohan.id, eventType: ActivityType.CREATED, newValue: 'OPEN', createdAt: t3Created },
      { ticketId: t3.id, actorId: staffAcad.id, eventType: ActivityType.ASSIGNED, newValue: staffAcad.name, createdAt: hoursAgo(18) },
      { ticketId: t3.id, actorId: staffAcad.id, eventType: ActivityType.STATUS_CHANGED, oldValue: 'OPEN', newValue: 'WAITING_FOR_STUDENT', createdAt: hoursAgo(15) },
      { ticketId: t3.id, actorId: staffAcad.id, eventType: ActivityType.INFO_REQUESTED, newValue: 'Medical discharge summary missing', createdAt: hoursAgo(15) }
    ]
  });

  await prisma.ticketComment.createMany({
    data: [
      { ticketId: t3.id, authorId: staffAcad.id, message: 'Please upload the stamped Hospital Discharge Summary and fitness certificate signed by the Chief Medical Officer.', visibility: CommentVisibility.PUBLIC, createdAt: hoursAgo(15) },
      { ticketId: t3.id, authorId: staffAcad.id, message: 'HoD approval requires formal CMO seal. Awaiting student reply before routing to Board of Studies.', visibility: CommentVisibility.INTERNAL, createdAt: hoursAgo(15) }
    ]
  });

  // TICKET 4: RESOLVED WITHIN SLA (Resolved in 14 hours against 24h SLA)
  const t4Created = hoursAgo(50);
  const t4Sla = hoursFrom(t4Created, 24);
  const t4Resolved = hoursFrom(t4Created, 14);
  const t4 = await prisma.ticket.create({
    data: {
      ticketNumber: 'TKT-2026-00004',
      title: 'Hall ticket subject mismatch for End-Sem Exam',
      description: 'My hall ticket lists Machine Learning instead of Cloud Computing elective. Need this corrected before Monday exam.',
      status: TicketStatus.RESOLVED,
      priority: Priority.HIGH,
      studentId: studentAarav.id,
      categoryId: catExams.id,
      departmentId: acadDept.id,
      assignedStaffId: staffAcad.id,
      assignedById: adminUser.id,
      assignedAt: hoursAgo(48),
      createdAt: t4Created,
      slaDueAt: t4Sla,
      resolvedAt: t4Resolved,
      resolutionNotes: 'Updated course registration record in ERP and regenerated PDF hall ticket.'
    }
  });

  await prisma.ticketActivity.createMany({
    data: [
      { ticketId: t4.id, actorId: studentAarav.id, eventType: ActivityType.CREATED, newValue: 'OPEN', createdAt: t4Created },
      { ticketId: t4.id, actorId: adminUser.id, eventType: ActivityType.ASSIGNED, newValue: staffAcad.name, createdAt: hoursAgo(48) },
      { ticketId: t4.id, actorId: staffAcad.id, eventType: ActivityType.STATUS_CHANGED, oldValue: 'ASSIGNED', newValue: 'IN_PROGRESS', createdAt: hoursAgo(40) },
      { ticketId: t4.id, actorId: staffAcad.id, eventType: ActivityType.RESOLVED, newValue: 'RESOLVED', metadata: { withinSla: true }, createdAt: t4Resolved }
    ]
  });

  await prisma.ticketComment.create({
    data: {
      ticketId: t4.id,
      authorId: staffAcad.id,
      message: 'Hall ticket elective updated to Cloud Computing (CS409). You can re-download the revised PDF from student portal.',
      visibility: CommentVisibility.PUBLIC,
      createdAt: t4Resolved
    }
  });

  // TICKET 5: RESOLVED WITH SLA BREACH (Resolved in 40 hours against 24h SLA)
  const t5Created = hoursAgo(90);
  const t5Sla = hoursFrom(t5Created, 24);
  const t5Resolved = hoursFrom(t5Created, 40); // 16 hours breach
  const t5 = await prisma.ticket.create({
    data: {
      ticketNumber: 'TKT-2026-00005',
      title: 'Fee waiver verification for National Sports Quota',
      description: 'Submitted Gold Medal certificate from Inter-University Badminton tournament for 50% tuition waiver.',
      status: TicketStatus.RESOLVED,
      priority: Priority.HIGH,
      studentId: studentSneha.id,
      categoryId: catFees.id,
      departmentId: finDept.id,
      assignedStaffId: staffFinance.id,
      assignedById: adminUser.id,
      assignedAt: hoursAgo(85),
      createdAt: t5Created,
      slaDueAt: t5Sla,
      resolvedAt: t5Resolved,
      resolutionNotes: 'Verified with Director of Physical Education. Fee concession voucher #FC-8902 generated.'
    }
  });

  await prisma.ticketActivity.createMany({
    data: [
      { ticketId: t5.id, actorId: studentSneha.id, eventType: ActivityType.CREATED, newValue: 'OPEN', createdAt: t5Created },
      { ticketId: t5.id, actorId: staffFinance.id, eventType: ActivityType.STATUS_CHANGED, oldValue: 'OPEN', newValue: 'IN_PROGRESS', createdAt: hoursAgo(80) },
      { ticketId: t5.id, actorId: staffFinance.id, eventType: ActivityType.RESOLVED, newValue: 'RESOLVED', metadata: { withinSla: false, breachedHours: 16 }, createdAt: t5Resolved }
    ]
  });

  // TICKET 6: UNASSIGNED TICKET (Newly submitted, status OPEN)
  const t6Created = hoursAgo(3);
  const t6Sla = hoursFrom(t6Created, 48);
  const t6 = await prisma.ticket.create({
    data: {
      ticketNumber: 'TKT-2026-00006',
      title: 'Hostel Block B 3rd Floor Water Purifier Leaking',
      description: 'The RO water dispenser in Block B, corridor 3 has been leaking continuously since this morning, causing slippery floor hazard.',
      status: TicketStatus.OPEN,
      priority: Priority.MEDIUM,
      studentId: studentRohan.id,
      categoryId: catHostel.id,
      departmentId: hostelDept.id,
      createdAt: t6Created,
      slaDueAt: t6Sla
    }
  });

  await prisma.ticketActivity.create({
    data: { ticketId: t6.id, actorId: studentRohan.id, eventType: ActivityType.CREATED, newValue: 'OPEN', createdAt: t6Created }
  });

  // TICKET 7: REOPENED TICKET (Resolved, then student reopened with reason)
  const t7Created = hoursAgo(100);
  const t7Sla = hoursFrom(t7Created, 72);
  const t7Resolved = hoursAgo(40);
  const t7Reopened = hoursAgo(12);
  const t7 = await prisma.ticket.create({
    data: {
      ticketNumber: 'TKT-2026-00007',
      title: 'Bonafide Certificate Issued with Name Spelling Mistake',
      description: 'Requested bonafide certificate for passport application. The certificate generated has my surname spelled as "Pattel" instead of "Patel".',
      status: TicketStatus.REOPENED,
      priority: Priority.LOW,
      studentId: studentAarav.id,
      categoryId: catCertificates.id,
      departmentId: acadDept.id,
      assignedStaffId: staffAcad.id,
      assignedById: adminUser.id,
      assignedAt: hoursAgo(95),
      createdAt: t7Created,
      slaDueAt: t7Sla,
      resolvedAt: t7Resolved,
      reopenedAt: t7Reopened,
      reopenReason: 'Certificate reprinted has incorrect father initials as well. Please reissue with Aadhaar verified spelling.'
    }
  });

  await prisma.ticketActivity.createMany({
    data: [
      { ticketId: t7.id, actorId: studentAarav.id, eventType: ActivityType.CREATED, newValue: 'OPEN', createdAt: t7Created },
      { ticketId: t7.id, actorId: staffAcad.id, eventType: ActivityType.RESOLVED, newValue: 'RESOLVED', createdAt: t7Resolved },
      { ticketId: t7.id, actorId: studentAarav.id, eventType: ActivityType.REOPENED, oldValue: 'RESOLVED', newValue: 'REOPENED', metadata: { reason: 'Incorrect spelling' }, createdAt: t7Reopened }
    ]
  });

  await prisma.ticketComment.createMany({
    data: [
      { ticketId: t7.id, authorId: staffAcad.id, message: 'Original bonafide uploaded. Closing ticket.', visibility: CommentVisibility.PUBLIC, createdAt: t7Resolved },
      { ticketId: t7.id, authorId: studentAarav.id, message: 'Please see my reopen note: father initials and surname both need verification.', visibility: CommentVisibility.PUBLIC, createdAt: t7Reopened }
    ]
  });

  // Additional 14 Tickets to form 21 comprehensive realistic records
  const additionalTicketsData = [
    {
      ticketNumber: 'TKT-2026-00008',
      title: 'Campus Wi-Fi authentication certificate expired in Library',
      description: 'Cannot connect to Eduroam / Campus-WiFi from 2nd floor library. Devices report "Untrusted Root Certificate".',
      status: TicketStatus.IN_PROGRESS,
      priority: Priority.HIGH,
      studentId: studentSneha.id,
      categoryId: catTechSupport.id,
      departmentId: itDept.id,
      staffId: staffTech.id,
      hoursAgoCreated: 14,
      slaHours: 24
    },
    {
      ticketNumber: 'TKT-2026-00009',
      title: 'RFID Student ID Card De-magnetized at Hostel Turnstile',
      description: 'My smart identity card stopped triggering the RFID reader at the campus south gate and mess counter.',
      status: TicketStatus.OPEN,
      priority: Priority.LOW,
      studentId: studentRohan.id,
      categoryId: catIdCard.id,
      departmentId: adminDept.id,
      staffId: null,
      hoursAgoCreated: 22,
      slaHours: 72
    },
    {
      ticketNumber: 'TKT-2026-00010',
      title: 'Fee payment receipt not generated after UPI deduction',
      description: 'Paid hostel mess fee of INR 18,500 via Google Pay UPI. UTR is 4099238812. Status still says Unpaid.',
      status: TicketStatus.ASSIGNED,
      priority: Priority.HIGH,
      studentId: studentSneha.id,
      categoryId: catFees.id,
      departmentId: finDept.id,
      staffId: staffFinance.id,
      hoursAgoCreated: 10,
      slaHours: 24
    },
    {
      ticketNumber: 'TKT-2026-00011',
      title: 'Post-Matric State Scholarship portal verification delay',
      description: 'NSP scholarship portal requires institute nodal officer e-verification by 30th Sep. Application ID: DL2026-8819.',
      status: TicketStatus.IN_PROGRESS,
      priority: Priority.MEDIUM,
      studentId: studentAarav.id,
      categoryId: catScholarship.id,
      departmentId: finDept.id,
      staffId: staffFinance.id,
      hoursAgoCreated: 36,
      slaHours: 48
    },
    {
      ticketNumber: 'TKT-2026-00012',
      title: 'Air conditioning failure in CAD/CAM design lab 2',
      description: 'Workstations shutting down due to thermal throttling during afternoon lab sessions. Temp is 34C.',
      status: TicketStatus.RESOLVED,
      priority: Priority.MEDIUM,
      studentId: studentRohan.id,
      categoryId: catTechSupport.id,
      departmentId: itDept.id,
      staffId: staffTech.id,
      hoursAgoCreated: 55,
      slaHours: 48,
      resolvedAtHours: 35
    },
    {
      ticketNumber: 'TKT-2026-00013',
      title: 'Route #7 Campus Shuttle Bus timing delay in morning',
      description: 'Bus #7 consistently arrives 25 minutes late at City Center stop, causing students to miss 8:30 AM lectures.',
      status: TicketStatus.IN_PROGRESS,
      priority: Priority.LOW,
      studentId: studentSneha.id,
      categoryId: catTransport.id,
      departmentId: hostelDept.id,
      staffId: staffHostel.id,
      hoursAgoCreated: 42,
      slaHours: 72
    },
    {
      ticketNumber: 'TKT-2026-00014',
      title: 'Official Transcripts required for German Visa appointment',
      description: 'Need 3 sets of sealed official transcripts for TU Munich Masters application before next Friday.',
      status: TicketStatus.ASSIGNED,
      priority: Priority.LOW,
      studentId: studentAarav.id,
      categoryId: catCertificates.id,
      departmentId: acadDept.id,
      staffId: staffAcad.id,
      hoursAgoCreated: 18,
      slaHours: 72
    },
    {
      ticketNumber: 'TKT-2026-00015',
      title: 'Hostel Room Change request due to medical asthma condition',
      description: 'Current ground floor room has damp walls exacerbating asthma. Doctor recommended upper floor well-ventilated room.',
      status: TicketStatus.WAITING_FOR_STUDENT,
      priority: Priority.MEDIUM,
      studentId: studentRohan.id,
      categoryId: catHostel.id,
      departmentId: hostelDept.id,
      staffId: staffHostel.id,
      hoursAgoCreated: 28,
      slaHours: 48
    },
    {
      ticketNumber: 'TKT-2026-00016',
      title: 'Grade mismatch in Operating Systems (CS301) End-Sem transcript',
      description: 'Grade sheet shows B+ whereas continuous evaluation + final exam total computes to A (88 marks).',
      status: TicketStatus.IN_PROGRESS,
      priority: Priority.HIGH,
      studentId: studentSneha.id,
      categoryId: catExams.id,
      departmentId: acadDept.id,
      staffId: staffAcad.id,
      hoursAgoCreated: 21,
      slaHours: 24
    },
    {
      ticketNumber: 'TKT-2026-00017',
      title: 'Urgent Lab GPU Cluster SSH Key Authorization',
      description: 'Need public key added to cluster head node `gpu-compute.campus.edu` for ongoing final-year capstone project.',
      status: TicketStatus.OPEN,
      priority: Priority.URGENT,
      studentId: studentAarav.id,
      categoryId: catTechSupport.id,
      departmentId: itDept.id,
      staffId: null,
      hoursAgoCreated: 2,
      slaHours: 8
    },
    {
      ticketNumber: 'TKT-2026-00018',
      title: 'Mess Menu grievance - Quality of evening snacks and milk',
      description: 'Repeated instances of stale milk and substandard snacks served in Hostel Mess Block A over the past week.',
      status: TicketStatus.CLOSED,
      priority: Priority.MEDIUM,
      studentId: studentRohan.id,
      categoryId: catHostel.id,
      departmentId: hostelDept.id,
      staffId: staffHostel.id,
      hoursAgoCreated: 120,
      slaHours: 48,
      resolvedAtHours: 75,
      closedAtHours: 60
    },
    {
      ticketNumber: 'TKT-2026-00019',
      title: 'Duplicate Fee Receipt download button broken on mobile Safari',
      description: 'Clicking "Download PDF Receipt" triggers 404 on mobile web browser. Desktop version works fine.',
      status: TicketStatus.RESOLVED,
      priority: Priority.LOW,
      studentId: studentSneha.id,
      categoryId: catTechSupport.id,
      departmentId: itDept.id,
      staffId: staffTech.id,
      hoursAgoCreated: 65,
      slaHours: 72,
      resolvedAtHours: 40
    },
    {
      ticketNumber: 'TKT-2026-00020',
      title: 'Parking permit sticker for two-wheeler not received',
      description: 'Submitted vehicle RC book and driving license at security office 10 days ago. Sticker not yet issued.',
      status: TicketStatus.OPEN,
      priority: Priority.LOW,
      studentId: studentRohan.id,
      categoryId: catOther.id,
      departmentId: adminDept.id,
      staffId: null,
      hoursAgoCreated: 4,
      slaHours: 72
    },
    {
      ticketNumber: 'TKT-2026-00021',
      title: 'Refund of caution deposit after semester withdrawal',
      description: 'Withdrew from honors minor course in August. Requesting refund of caution deposit of INR 5,000.',
      status: TicketStatus.IN_PROGRESS,
      priority: Priority.MEDIUM,
      studentId: studentAarav.id,
      categoryId: catFees.id,
      departmentId: finDept.id,
      staffId: staffFinance.id,
      hoursAgoCreated: 15,
      slaHours: 48
    }
  ];

  for (const item of additionalTicketsData) {
    const createdTime = hoursAgo(item.hoursAgoCreated);
    const slaDue = hoursFrom(createdTime, item.slaHours);
    const resolvedTime = item.resolvedAtHours ? hoursAgo(item.resolvedAtHours) : null;
    const closedTime = item.closedAtHours ? hoursAgo(item.closedAtHours) : null;

    const t = await prisma.ticket.create({
      data: {
        ticketNumber: item.ticketNumber,
        title: item.title,
        description: item.description,
        status: item.status,
        priority: item.priority,
        studentId: item.studentId,
        categoryId: item.categoryId,
        departmentId: item.departmentId,
        assignedStaffId: item.staffId,
        assignedById: item.staffId ? adminUser.id : null,
        assignedAt: item.staffId ? hoursFrom(createdTime, 1) : null,
        createdAt: createdTime,
        slaDueAt: slaDue,
        resolvedAt: resolvedTime,
        closedAt: closedTime,
        resolutionNotes: resolvedTime ? 'Request processed and verified by department staff.' : null
      }
    });

    await prisma.ticketActivity.create({
      data: {
        ticketId: t.id,
        actorId: item.studentId,
        eventType: ActivityType.CREATED,
        newValue: 'OPEN',
        createdAt: createdTime
      }
    });

    if (item.staffId) {
      await prisma.ticketActivity.create({
        data: {
          ticketId: t.id,
          actorId: adminUser.id,
          eventType: ActivityType.ASSIGNED,
          newValue: 'Department Staff',
          createdAt: hoursFrom(createdTime, 1)
        }
      });
    }

    if (resolvedTime) {
      await prisma.ticketActivity.create({
        data: {
          ticketId: t.id,
          actorId: item.staffId || adminUser.id,
          eventType: ActivityType.RESOLVED,
          newValue: 'RESOLVED',
          createdAt: resolvedTime
        }
      });
    }
  }

  console.log('✅ Database seeded successfully!');
  console.log('--- DEMO CREDENTIALS ---');
  console.log('Admin:   admin@campusresolve.demo    / Admin@123');
  console.log('Staff:   staff@campusresolve.demo    / Staff@123 (Finance)');
  console.log('Staff:   staff.it@campusresolve.demo / Staff@123 (IT)');
  console.log('Student: student@campusresolve.demo  / Student@123 (Aarav Patel)');
  console.log('Student: student2@campusresolve.demo / Student@123 (Sneha Kulkarni)');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

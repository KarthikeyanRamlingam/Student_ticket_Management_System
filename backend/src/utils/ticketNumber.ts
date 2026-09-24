import { prisma } from '../config/prisma';

export async function generateTicketNumber(): Promise<string> {
  const currentYear = new Date().getFullYear();
  const prefix = `TKT-${currentYear}-`;

  // Find the highest ticket number for the current year
  const lastTicket = await prisma.ticket.findFirst({
    where: {
      ticketNumber: {
        startsWith: prefix
      }
    },
    orderBy: {
      ticketNumber: 'desc'
    },
    select: {
      ticketNumber: true
    }
  });

  let nextSequence = 1;
  if (lastTicket && lastTicket.ticketNumber) {
    const parts = lastTicket.ticketNumber.split('-');
    if (parts.length === 3) {
      const parsedSeq = parseInt(parts[2], 10);
      if (!isNaN(parsedSeq)) {
        nextSequence = parsedSeq + 1;
      }
    }
  }

  const paddedSeq = String(nextSequence).padStart(5, '0');
  return `${prefix}${paddedSeq}`;
}

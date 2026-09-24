import app from './app';
import { ENV } from './config/env';
import { prisma } from './config/prisma';

async function bootstrap() {
  try {
    await prisma.$connect();
    console.log('✅ Connected to PostgreSQL database');

    const server = app.listen(ENV.PORT, () => {
      console.log(`🚀 CampusResolve API Server running on http://localhost:${ENV.PORT}`);
      console.log(`📡 Environment: ${ENV.NODE_ENV}`);
      console.log(`🔗 Allowed Frontend: ${ENV.FRONTEND_URL}`);
    });

    const gracefulShutdown = async (signal: string) => {
      console.log(`\nReceived ${signal}. Shutting down gracefully...`);
      server.close(async () => {
        await prisma.$disconnect();
        console.log('PostgreSQL client disconnected. Server closed.');
        process.exit(0);
      });
    };

    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  } catch (err) {
    console.error('❌ Failed to start application:', err);
    await prisma.$disconnect();
    process.exit(1);
  }
}

bootstrap();

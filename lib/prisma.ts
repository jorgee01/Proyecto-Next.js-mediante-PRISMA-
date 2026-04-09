import 'server-only';

import { PrismaMysql2 } from '@/lib/prisma-adapter-mysql2';

import { PrismaClient } from '@/generated/prisma/client';

  

declare global {

  // eslint-disable-next-line no-var

  var prismaGlobal: PrismaClient | undefined;

}

  

function createPrismaClient() {

  const adapter = new PrismaMysql2({

    host: process.env.DATABASE_HOST,

    port: Number(process.env.DATABASE_PORT || 3306),

    user: process.env.DATABASE_USER,

    password: process.env.DATABASE_PASSWORD,

    database: process.env.DATABASE_NAME,

    connectionLimit: 3,

    connectTimeout: 10000,

    acquireTimeout: 15000,

  });

  return new PrismaClient({ adapter });

}

  

export const prisma = global.prismaGlobal ?? createPrismaClient();

  

global.prismaGlobal = prisma;
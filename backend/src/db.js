import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

export function formatJSON(value) {
  if (typeof value === 'string') {
    try { return JSON.parse(value); } catch { return null; }
  }
  return value;
}

export default prisma;

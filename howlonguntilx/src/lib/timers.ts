import { prisma } from './db';
import type { TimerInput } from './validators';

export async function getUserTimers(userId: string) {
  return prisma.timer.findMany({
    where: { userId },
    orderBy: { targetDate: 'asc' },
  });
}

export async function createTimer(userId: string, data: TimerInput) {
  return prisma.timer.create({
    data: { ...data, userId, targetDate: new Date(data.targetDate) },
  });
}

export async function deleteTimer(userId: string, timerId: string) {
  return prisma.timer.deleteMany({ where: { id: timerId, userId } });
}

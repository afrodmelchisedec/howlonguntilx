// FILE: src/lib/userEvents.ts
import { prisma } from './db';
import { generateUniqueUserEventSlug } from './userEventSlug';
import type { UserEventInput, UserEventUpdateInput } from './validators';

const FREE_EVENT_CAP = 3;
const FREE_IMAGE_CAP = 1;
const PRO_IMAGE_CAP = 4;

// Thrown for plan-limit violations specifically, so routes can map it to
// a 403 with a user-facing message instead of a generic 500.
export class UserEventLimitError extends Error {}

export async function getUserEvents(authorId: string) {
  return prisma.userEvent.findMany({
    where: { authorId },
    orderBy: { createdAt: 'desc' },
  });
}

export async function createUserEvent(authorId: string, data: UserEventInput, isAdmin = false) {
  // Live plan lookup rather than trusting session.user.plan — the JWT
  // only refreshes plan at sign-in, so a mid-session upgrade/downgrade
  // wouldn't be reflected there yet. This is the enforcement path that
  // actually matters, so it goes straight to the DB.
  const user = await prisma.user.findUnique({ where: { id: authorId }, select: { plan: true } });
  const plan = user?.plan ?? 'FREE';

  if (!isAdmin && plan === 'FREE') {
    const count = await prisma.userEvent.count({ where: { authorId } });
    if (count >= FREE_EVENT_CAP) {
      throw new UserEventLimitError(`Free plan is limited to ${FREE_EVENT_CAP} events. Upgrade to Pro for unlimited events.`);
    }
  }

  const images = data.images ?? [];
  const imageCap = isAdmin ? PRO_IMAGE_CAP : plan === 'PRO' ? PRO_IMAGE_CAP : FREE_IMAGE_CAP;
  if (!isAdmin && images.length > imageCap) {
    throw new UserEventLimitError(`Your plan allows up to ${imageCap} image(s) per event.`);
  }

  const slug = await generateUniqueUserEventSlug(data.title);

  return prisma.userEvent.create({
    data: {
      slug,
      title: data.title,
      description: data.description,
      targetDate: new Date(data.targetDate),
      visibility: data.visibility ?? 'PUBLIC',
      categoryId: data.categoryId || null,
      images: images.length ? images : undefined,
      authorId,
    },
  });
}

export async function updateUserEvent(authorId: string, id: string, data: UserEventUpdateInput) {
  if (data.images) {
    const user = await prisma.user.findUnique({ where: { id: authorId }, select: { plan: true } });
    const plan = user?.plan ?? 'FREE';
    const imageCap = plan === 'PRO' ? PRO_IMAGE_CAP : FREE_IMAGE_CAP;
    if (data.images.length > imageCap) {
      throw new UserEventLimitError(`Your plan allows up to ${imageCap} image(s) per event.`);
    }
  }

  const updateData: Record<string, unknown> = { ...data };
  if (data.targetDate) updateData.targetDate = new Date(data.targetDate);

  // Same ownership pattern as deleteTimer: updateMany with an authorId
  // filter means a non-owner's request just matches zero rows rather
  // than needing a separate existence + ownership check.
  const result = await prisma.userEvent.updateMany({
    where: { id, authorId },
    data: updateData,
  });
  return result.count > 0;
}

export async function deleteUserEvent(authorId: string, id: string) {
  return prisma.userEvent.deleteMany({ where: { id, authorId } });
}

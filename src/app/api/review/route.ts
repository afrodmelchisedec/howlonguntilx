// FILE: src/app/api/review/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { z } from 'zod';

const reviewSchema = z.object({
  rating: z.number().int().min(1).max(5),
  title: z.string().max(100).optional(),
  comment: z.string().max(2000).optional(),
});

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession();
    const body = await req.json().catch(() => null);

    if (!body) {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    const { rating, title, comment } = reviewSchema.parse(body);

    // Create the review
    const review = await prisma.review.create({
      data: {
        rating,
        title: title || undefined,
        comment: comment || undefined,
        userId: session?.user?.id || null, // Allow anonymous reviews
      },
    });

    return NextResponse.json({
      success: true,
      reviewId: review.id,
      message: 'Thank you for your review!'
    });
  } catch (error) {
    console.error('Error creating review:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid review data', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to submit review' },
      { status: 500 }
    );
  }
}
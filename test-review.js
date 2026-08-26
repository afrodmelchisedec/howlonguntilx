const { prisma } = require('./src/lib/prisma.ts');

async function testReview() {
  try {
    // Test connection by counting users
    const userCount = await prisma.user.count();
    console.log('Database connection successful! User count:', userCount);

    // Test creating a review
    const review = await prisma.review.create({
      data: {
        rating: 5,
        title: 'Test review',
        comment: 'This is a test review',
        userId: null,
      }
    });
    console.log('Test review created:', review);

    // Clean up
    await prisma.review.delete({
      where: { id: review.id }
    });
    console.log('Test review cleaned up');

  } catch (error) {
    console.error('Prisma test failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testReview();
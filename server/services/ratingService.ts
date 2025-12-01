import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface SubjectRatings {
  [subject: string]: number;
}

interface RatingAnalytics {
  totalRatings: number;
  averageRating: number;
  ratingDistribution: Record<number, number>;
  subjectAverages: SubjectRatings;
  trends?: Array<{
    date: string;
    averageRating: number;
  }>;
}

export class RatingService {
  /**
   * Rate a doubt (create or update)
   */
  async rateDoubt(userId: string, doubtId: string, rating: number, feedback?: string): Promise<void> {
    // Validate rating range
    if (rating < 1 || rating > 5) {
      throw new Error('Rating must be between 1 and 5');
    }

    // Check if doubt exists and belongs to user
    const doubt = await prisma.doubt.findFirst({
      where: {
        id: doubtId,
        userId,
      },
    });

    if (!doubt) {
      throw new Error('Doubt not found');
    }

    // Upsert rating (create or update)
    await prisma.doubtRating.upsert({
      where: {
        userId_doubtId: {
          userId,
          doubtId,
        },
      },
      create: {
        userId,
        doubtId,
        rating,
        feedback,
      },
      update: {
        rating,
        feedback,
        updatedAt: new Date(),
      },
    });
  }

  /**
   * Get rating for a doubt
   */
  async getRating(userId: string, doubtId: string): Promise<number | null> {
    const rating = await prisma.doubtRating.findUnique({
      where: {
        userId_doubtId: {
          userId,
          doubtId,
        },
      },
    });

    return rating?.rating || null;
  }

  /**
   * Get rating with feedback
   */
  async getRatingWithFeedback(userId: string, doubtId: string) {
    const rating = await prisma.doubtRating.findUnique({
      where: {
        userId_doubtId: {
          userId,
          doubtId,
        },
      },
    });

    if (!rating) {
      return null;
    }

    return {
      rating: rating.rating,
      feedback: rating.feedback,
      createdAt: rating.createdAt,
      updatedAt: rating.updatedAt,
    };
  }

  /**
   * Delete rating
   */
  async deleteRating(userId: string, doubtId: string): Promise<void> {
    await prisma.doubtRating.deleteMany({
      where: {
        userId,
        doubtId,
      },
    });
  }

  /**
   * Get average rating by subject
   */
  async getAverageRatingBySubject(userId: string): Promise<SubjectRatings> {
    const ratings = await prisma.doubtRating.findMany({
      where: { userId },
      include: {
        doubt: {
          select: {
            subject: true,
          },
        },
      },
    });

    // Group by subject and calculate averages
    const subjectGroups: Record<string, number[]> = {};

    ratings.forEach((rating) => {
      const subject = rating.doubt.subject;
      if (!subjectGroups[subject]) {
        subjectGroups[subject] = [];
      }
      subjectGroups[subject].push(rating.rating);
    });

    const averages: SubjectRatings = {};
    Object.entries(subjectGroups).forEach(([subject, ratings]) => {
      const sum = ratings.reduce((a, b) => a + b, 0);
      averages[subject] = Math.round((sum / ratings.length) * 10) / 10;
    });

    return averages;
  }

  /**
   * Get rating analytics for user
   */
  async getRatingAnalytics(userId: string): Promise<RatingAnalytics> {
    const ratings = await prisma.doubtRating.findMany({
      where: { userId },
      include: {
        doubt: {
          select: {
            subject: true,
          },
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    const totalRatings = ratings.length;

    // Calculate average rating
    const sum = ratings.reduce((acc, r) => acc + r.rating, 0);
    const averageRating = totalRatings > 0 ? Math.round((sum / totalRatings) * 10) / 10 : 0;

    // Calculate rating distribution
    const ratingDistribution: Record<number, number> = {
      1: 0,
      2: 0,
      3: 0,
      4: 0,
      5: 0,
    };

    ratings.forEach((r) => {
      ratingDistribution[r.rating]++;
    });

    // Calculate subject averages
    const subjectAverages = await this.getAverageRatingBySubject(userId);

    // Calculate trends (last 30 days, grouped by week)
    const trends = this.calculateTrends(ratings);

    return {
      totalRatings,
      averageRating,
      ratingDistribution,
      subjectAverages,
      trends,
    };
  }

  /**
   * Calculate rating trends over time
   */
  private calculateTrends(
    ratings: Array<{ rating: number; createdAt: Date }>
  ): Array<{ date: string; averageRating: number }> {
    if (ratings.length === 0) {
      return [];
    }

    // Group by week
    const weekGroups: Record<string, number[]> = {};

    ratings.forEach((rating) => {
      const date = new Date(rating.createdAt);
      const weekStart = new Date(date);
      weekStart.setDate(date.getDate() - date.getDay()); // Start of week
      const weekKey = weekStart.toISOString().split('T')[0];

      if (!weekGroups[weekKey]) {
        weekGroups[weekKey] = [];
      }
      weekGroups[weekKey].push(rating.rating);
    });

    // Calculate averages for each week
    const trends = Object.entries(weekGroups)
      .map(([date, ratings]) => {
        const sum = ratings.reduce((a, b) => a + b, 0);
        const average = Math.round((sum / ratings.length) * 10) / 10;
        return { date, averageRating: average };
      })
      .sort((a, b) => a.date.localeCompare(b.date));

    return trends;
  }

  /**
   * Get user's rated doubts
   */
  async getRatedDoubts(userId: string, minRating?: number) {
    const where: any = { userId };

    if (minRating !== undefined) {
      where.rating = { gte: minRating };
    }

    const ratings = await prisma.doubtRating.findMany({
      where,
      include: {
        doubt: true,
      },
      orderBy: {
        updatedAt: 'desc',
      },
    });

    return ratings.map((r) => ({
      doubtId: r.doubtId,
      rating: r.rating,
      feedback: r.feedback,
      ratedAt: r.updatedAt,
      doubt: {
        id: r.doubt.id,
        questionText: r.doubt.questionText,
        subject: r.doubt.subject,
        language: r.doubt.language,
        createdAt: r.doubt.createdAt,
      },
    }));
  }

  /**
   * Get rating statistics
   */
  async getRatingStats(userId: string) {
    const ratings = await prisma.doubtRating.findMany({
      where: { userId },
      select: { rating: true },
    });

    if (ratings.length === 0) {
      return {
        count: 0,
        average: 0,
        highest: 0,
        lowest: 0,
      };
    }

    const values = ratings.map((r) => r.rating);
    const sum = values.reduce((a, b) => a + b, 0);

    return {
      count: ratings.length,
      average: Math.round((sum / ratings.length) * 10) / 10,
      highest: Math.max(...values),
      lowest: Math.min(...values),
    };
  }

  /**
   * Check if user has rated enough doubts for insights
   */
  async hasEnoughRatingsForInsights(userId: string, threshold: number = 10): Promise<boolean> {
    const count = await prisma.doubtRating.count({
      where: { userId },
    });

    return count >= threshold;
  }
}

export const ratingService = new RatingService();

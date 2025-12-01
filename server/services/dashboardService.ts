import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface DoubtStats {
  totalDoubts: number;
  revisionCount: number;
  ratedCount: number;
  averageRating: number;
  subjectBreakdown: Record<string, number>;
  recentActivity: {
    last7Days: number;
    last30Days: number;
  };
}

export class DashboardService {
  /**
   * Get recent doubts for dashboard
   */
  async getRecentDoubts(userId: string, limit: number = 5) {
    const doubts = await prisma.doubt.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        rating: {
          select: {
            rating: true,
          },
        },
      },
    });

    return doubts.map((doubt) => ({
      id: doubt.id,
      questionText: doubt.questionText,
      subject: doubt.subject,
      language: doubt.language,
      createdAt: doubt.createdAt,
      rating: doubt.rating?.rating,
      isInRevision: doubt.isInRevision,
      isFavorite: doubt.isFavorite,
      messageCount: doubt.messageCount,
    }));
  }

  /**
   * Get revision count
   */
  async getRevisionCount(userId: string): Promise<number> {
    return await prisma.doubt.count({
      where: {
        userId,
        isInRevision: true,
      },
    });
  }

  /**
   * Get comprehensive doubt statistics
   */
  async getDoubtStats(userId: string): Promise<DoubtStats> {
    // Total doubts
    const totalDoubts = await prisma.doubt.count({
      where: { userId },
    });

    // Revision count
    const revisionCount = await this.getRevisionCount(userId);

    // Rated count and average
    const ratings = await prisma.doubtRating.findMany({
      where: { userId },
      select: { rating: true },
    });

    const ratedCount = ratings.length;
    const averageRating =
      ratedCount > 0
        ? Math.round((ratings.reduce((sum, r) => sum + r.rating, 0) / ratedCount) * 10) / 10
        : 0;

    // Subject breakdown
    const doubtsBySubject = await prisma.doubt.groupBy({
      by: ['subject'],
      where: { userId },
      _count: true,
    });

    const subjectBreakdown: Record<string, number> = {};
    doubtsBySubject.forEach((item) => {
      subjectBreakdown[item.subject] = item._count;
    });

    // Recent activity
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const last7Days = await prisma.doubt.count({
      where: {
        userId,
        createdAt: { gte: sevenDaysAgo },
      },
    });

    const last30Days = await prisma.doubt.count({
      where: {
        userId,
        createdAt: { gte: thirtyDaysAgo },
      },
    });

    return {
      totalDoubts,
      revisionCount,
      ratedCount,
      averageRating,
      subjectBreakdown,
      recentActivity: {
        last7Days,
        last30Days,
      },
    };
  }

  /**
   * Get dashboard summary
   */
  async getDashboardSummary(userId: string) {
    const [recentDoubts, stats] = await Promise.all([
      this.getRecentDoubts(userId, 5),
      this.getDoubtStats(userId),
    ]);

    return {
      recentDoubts,
      stats,
    };
  }

  /**
   * Get subject-wise performance
   */
  async getSubjectPerformance(userId: string) {
    const doubts = await prisma.doubt.findMany({
      where: { userId },
      include: {
        rating: {
          select: {
            rating: true,
          },
        },
      },
    });

    // Group by subject
    const subjectData: Record<
      string,
      {
        count: number;
        ratedCount: number;
        averageRating: number;
        inRevision: number;
      }
    > = {};

    doubts.forEach((doubt) => {
      const subject = doubt.subject;

      if (!subjectData[subject]) {
        subjectData[subject] = {
          count: 0,
          ratedCount: 0,
          averageRating: 0,
          inRevision: 0,
        };
      }

      subjectData[subject].count++;

      if (doubt.rating) {
        subjectData[subject].ratedCount++;
        subjectData[subject].averageRating += doubt.rating.rating;
      }

      if (doubt.isInRevision) {
        subjectData[subject].inRevision++;
      }
    });

    // Calculate averages
    Object.keys(subjectData).forEach((subject) => {
      const data = subjectData[subject];
      if (data.ratedCount > 0) {
        data.averageRating = Math.round((data.averageRating / data.ratedCount) * 10) / 10;
      }
    });

    return subjectData;
  }

  /**
   * Get learning streak (consecutive days with doubts)
   */
  async getLearningStreak(userId: string): Promise<number> {
    const doubts = await prisma.doubt.findMany({
      where: { userId },
      select: { createdAt: true },
      orderBy: { createdAt: 'desc' },
    });

    if (doubts.length === 0) {
      return 0;
    }

    let streak = 0;
    let currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);

    const dateSet = new Set(
      doubts.map((d) => {
        const date = new Date(d.createdAt);
        date.setHours(0, 0, 0, 0);
        return date.getTime();
      })
    );

    // Check if there's activity today or yesterday
    const today = currentDate.getTime();
    const yesterday = today - 24 * 60 * 60 * 1000;

    if (!dateSet.has(today) && !dateSet.has(yesterday)) {
      return 0; // Streak broken
    }

    // Count consecutive days
    let checkDate = dateSet.has(today) ? today : yesterday;

    while (dateSet.has(checkDate)) {
      streak++;
      checkDate -= 24 * 60 * 60 * 1000;
    }

    return streak;
  }

  /**
   * Get activity heatmap data (for visualization)
   */
  async getActivityHeatmap(userId: string, days: number = 90) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const doubts = await prisma.doubt.findMany({
      where: {
        userId,
        createdAt: { gte: startDate },
      },
      select: { createdAt: true },
    });

    // Group by date
    const activityMap: Record<string, number> = {};

    doubts.forEach((doubt) => {
      const date = new Date(doubt.createdAt);
      const dateKey = date.toISOString().split('T')[0];

      if (!activityMap[dateKey]) {
        activityMap[dateKey] = 0;
      }
      activityMap[dateKey]++;
    });

    return activityMap;
  }

  /**
   * Get quick stats for dashboard header
   */
  async getQuickStats(userId: string) {
    const [totalDoubts, revisionCount, learningStreak] = await Promise.all([
      prisma.doubt.count({ where: { userId } }),
      this.getRevisionCount(userId),
      this.getLearningStreak(userId),
    ]);

    return {
      totalDoubts,
      revisionCount,
      learningStreak,
    };
  }
}

export const dashboardService = new DashboardService();

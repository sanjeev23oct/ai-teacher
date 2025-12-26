import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface AdminDashboardMetrics {
  totalUsers: number;
  totalDoubts: number;
  totalSmartNotes: number;
  totalGradingSessions: number;
  totalASLPractices: number;
  totalNCERTChapters: number;
  totalGroupStudySessions: number;
  totalRevisions: number;
  recentUsers: Array<{
    id: string;
    name: string;
    email: string;
    createdAt: Date;
  }>;
  recentNotes: Array<{
    id: string;
    title: string;
    subject: string;
    createdAt: Date;
    user: {
      name: string;
    };
  }>;
  userGrowth: Array<{
    date: string;
    count: number;
  }>;
  notesGrowth: Array<{
    date: string;
    count: number;
  }>;
}

export class AdminDashboardService {
  async getDashboardMetrics(): Promise<AdminDashboardMetrics> {
    // Get all counts in parallel
    const [
      totalUsers,
      totalDoubts,
      totalSmartNotes,
      totalGradingSessions,
      totalASLPractices,
      totalNCERTChapters,
      totalGroupStudySessions,
      totalRevisions,
      recentUsers,
      recentNotes
    ] = await Promise.all([
      prisma.user.count(),
      prisma.doubt.count(),
      prisma.smartNote.count(),
      prisma.grading.count(),
      prisma.aSLPractice.count(),
      prisma.nCERTChapterStudy.count(),
      prisma.groupStudySession.count(),
      prisma.revisionSession.count(),
      prisma.user.findMany({
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: {
          id: true,
          name: true,
          email: true,
          createdAt: true
        }
      }),
      prisma.smartNote.findMany({
        orderBy: { createdAt: 'desc' },
        take: 5,
        include: {
          user: {
            select: {
              name: true
            }
          }
        }
      })
    ]);

    // Get user growth data (last 30 days)
    const userGrowth = await prisma.user.groupBy({
      by: ['createdAt'],
      where: {
        createdAt: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
        }
      },
      _count: true,
    });

    // Format user growth data by date
    const formattedUserGrowth = userGrowth.map(item => ({
      date: item.createdAt.toISOString().split('T')[0],
      count: item._count
    }));

    // Get notes growth data (last 30 days)
    const notesGrowth = await prisma.smartNote.groupBy({
      by: ['createdAt'],
      where: {
        createdAt: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
        }
      },
      _count: true,
    });

    // Format notes growth data by date
    const formattedNotesGrowth = notesGrowth.map((item: any) => ({
      date: item.createdAt.toISOString().split('T')[0],
      count: item._count
    }));

    return {
      totalUsers,
      totalDoubts,
      totalSmartNotes,
      totalGradingSessions,
      totalASLPractices,
      totalNCERTChapters,
      totalGroupStudySessions,
      totalRevisions,
      recentUsers,
      recentNotes,
      userGrowth: formattedUserGrowth,
      notesGrowth: formattedNotesGrowth
    };
  }
}

export const adminDashboardService = new AdminDashboardService();
export interface AdminDashboardMetrics {
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
    createdAt: string;
  }>;
  recentNotes: Array<{
    id: string;
    title: string;
    subject: string;
    createdAt: string;
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

export interface MetricCardProps {
  title: string;
  value: number | string;
  icon: React.ReactNode;
  color: string;
  description?: string;
}
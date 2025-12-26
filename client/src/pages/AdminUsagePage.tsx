import React, { useState, useEffect } from 'react';
import { Users, FileText, GraduationCap, UserPlus, Activity, BarChart3, BookOpen, Mic, Users as UsersIcon } from 'lucide-react';
import { getApiUrl } from '../config';
import { authenticatedFetch } from '../utils/api';
import { useAuth } from '../contexts/AuthContext';
import { isCurrentUserAdmin } from '../utils/admin';
import MetricCard from '../components/admin/MetricCard';
import type { AdminDashboardMetrics } from '../types/admin';

const AdminUsagePage: React.FC = () => {
  const { user } = useAuth();
  const [metrics, setMetrics] = useState<AdminDashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMetrics();
  }, []);

  const fetchMetrics = async () => {
    try {
      setLoading(true);
      const response = await authenticatedFetch(
        getApiUrl('/api/admin/dashboard')
      );
      
      if (response.ok) {
        const data = await response.json();
        setMetrics(data);
      }
    } catch (error) {
      console.error('Failed to fetch metrics:', error);
    } finally {
      setLoading(false);
    }
  };

  // Check if user is admin
  if (!user) {
    return (
      <div className="max-w-4xl mx-auto p-4">
        <div className="bg-yellow-900/20 border border-yellow-700/50 rounded-lg p-6">
          <div className="flex items-start gap-4">
            <Activity className="w-6 h-6 text-yellow-500 flex-shrink-0 mt-1" />
            <div>
              <h3 className="text-lg font-semibold text-yellow-500 mb-2">Authentication Required</h3>
              <p className="text-gray-300">Please login to access admin features.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!isCurrentUserAdmin(user.email)) {
    return (
      <div className="max-w-4xl mx-auto p-4">
        <div className="bg-red-900/20 border border-red-700/50 rounded-lg p-6">
          <div className="flex items-start gap-4">
            <Activity className="w-6 h-6 text-red-500 flex-shrink-0 mt-1" />
            <div>
              <h3 className="text-lg font-semibold text-red-500 mb-2">Admin Access Required</h3>
              <p className="text-gray-300 mb-4">
                You do not have permission to access admin features. Only authorized administrators can view usage metrics.
              </p>
              <p className="text-sm text-gray-400">
                If you believe you should have admin access, please contact your system administrator.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto p-4">
        <div className="text-center py-8">
          <div className="text-gray-400">Loading dashboard metrics...</div>
        </div>
      </div>
    );
  }

  if (!metrics) {
    return (
      <div className="max-w-6xl mx-auto p-4">
        <div className="text-center py-8">
          <div className="text-gray-400">Failed to load dashboard metrics</div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-4">
      <div className="text-center mb-6">
        <h1 className="text-3xl font-bold mb-2 flex items-center justify-center gap-2 bg-gradient-to-r from-blue-400 via-purple-500 to-blue-600 bg-clip-text text-transparent">
          <BarChart3 className="w-8 h-8 text-blue-500" />
          Admin Usage Dashboard
        </h1>
        <p className="text-gray-400 mb-4">
          Monitor app usage and performance metrics
        </p>
      </div>

      {/* Main Metrics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <MetricCard
          title="Total Users"
          value={metrics.totalUsers}
          icon={<Users className="w-6 h-6 text-blue-400" />}
          color="bg-blue-500"
        />
        
        <MetricCard
          title="Total Notes"
          value={metrics.totalSmartNotes}
          icon={<FileText className="w-6 h-6 text-green-400" />}
          color="bg-green-500"
        />
        
        <MetricCard
          title="Total Doubts"
          value={metrics.totalDoubts}
          icon={<GraduationCap className="w-6 h-6 text-purple-400" />}
          color="bg-purple-500"
        />
        
        <MetricCard
          title="Total Revisions"
          value={metrics.totalRevisions}
          icon={<UserPlus className="w-6 h-6 text-orange-400" />}
          color="bg-orange-500"
        />
      </div>

      {/* Additional Metrics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <MetricCard
          title="Grading Sessions"
          value={metrics.totalGradingSessions}
          icon={<BookOpen className="w-6 h-6 text-blue-400" />}
          color="bg-blue-500"
        />
        
        <MetricCard
          title="ASL Practices"
          value={metrics.totalASLPractices}
          icon={<Mic className="w-6 h-6 text-green-400" />}
          color="bg-green-500"
        />
        
        <MetricCard
          title="NCERT Chapters"
          value={metrics.totalNCERTChapters}
          icon={<BookOpen className="w-6 h-6 text-purple-400" />}
          color="bg-purple-500"
        />
        
        <MetricCard
          title="Group Sessions"
          value={metrics.totalGroupStudySessions}
          icon={<UsersIcon className="w-6 h-6 text-orange-400" />}
          color="bg-orange-500"
        />
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-surface rounded-lg border border-gray-800 p-4">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-blue-400" />
            Recent Users
          </h3>
          <div className="space-y-2">
            {metrics.recentUsers.map((user) => (
              <div key={user.id} className="flex justify-between items-center py-2 border-b border-gray-800 last:border-0">
                <div>
                  <p className="text-white font-medium">{user.name}</p>
                  <p className="text-xs text-gray-400">{user.email}</p>
                </div>
                <p className="text-xs text-gray-500">
                  {new Date(user.createdAt).toLocaleDateString()}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-surface rounded-lg border border-gray-800 p-4">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <FileText className="w-5 h-5 text-green-400" />
            Recent Notes
          </h3>
          <div className="space-y-2">
            {metrics.recentNotes.map((note) => (
              <div key={note.id} className="flex justify-between items-center py-2 border-b border-gray-800 last:border-0">
                <div>
                  <p className="text-white font-medium truncate max-w-[180px]">{note.title}</p>
                  <p className="text-xs text-gray-400">by {note.user.name}</p>
                </div>
                <p className="text-xs text-gray-500">
                  {new Date(note.createdAt).toLocaleDateString()}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminUsagePage;
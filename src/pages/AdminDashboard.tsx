import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Card, CardContent, CardHeader } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import {
  Users,
  AlertCircle,
  TrendingUp,
  Award,
  Building,
  UserCog,
} from 'lucide-react';

interface Department {
  id: string;
  name: string;
  transparency_score: number;
  avg_resolution_days: number;
  issue_count: number;
  resolved_count: number;
}

interface AdminDashboardProps {
  onNavigate: (page: string) => void;
}

export function AdminDashboard({ onNavigate }: AdminDashboardProps) {
  const { user, profile } = useAuth();
  const [stats, setStats] = useState({
    totalIssues: 0,
    totalUsers: 0,
    avgResolutionDays: 0,
    cityTrustScore: 0,
  });
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user && profile?.role === 'admin') {
      fetchAdminData();
    }
  }, [user, profile]);

  const fetchAdminData = async () => {
    const [issuesResult, usersResult, departmentsResult, feedbackResult] =
      await Promise.all([
        supabase.from('issues').select('*'),
        supabase.from('profiles').select('id'),
        supabase.from('departments').select('*'),
        supabase.from('issue_feedback').select('rating'),
      ]);

    const issues = issuesResult.data || [];
    const totalUsers = usersResult.data?.length || 0;

    const resolvedIssues = issues.filter(
      (i) => i.status === 'resolved' || i.status === 'closed'
    );
    const resolvedWithDates = resolvedIssues.filter(
      (i) => i.resolved_at && i.submitted_at
    );

    let avgDays = 0;
    if (resolvedWithDates.length > 0) {
      const totalDays = resolvedWithDates.reduce((acc, issue) => {
        const submitted = new Date(issue.submitted_at).getTime();
        const resolved = new Date(issue.resolved_at!).getTime();
        return acc + (resolved - submitted) / (1000 * 60 * 60 * 24);
      }, 0);
      avgDays = Math.round(totalDays / resolvedWithDates.length);
    }

    const feedbacks = feedbackResult.data || [];
    const avgRating =
      feedbacks.length > 0
        ? feedbacks.reduce((acc, f) => acc + f.rating, 0) / feedbacks.length
        : 0;
    const cityTrustScore = Math.round((avgRating / 5) * 100);

    const departmentsWithStats = await Promise.all(
      (departmentsResult.data || []).map(async (dept) => {
        const { data: deptIssues } = await supabase
          .from('issues')
          .select('id, status')
          .eq('assigned_to_department', dept.id);

        const issueCount = deptIssues?.length || 0;
        const resolvedCount =
          deptIssues?.filter((i) => i.status === 'resolved' || i.status === 'closed')
            .length || 0;

        return {
          ...dept,
          issue_count: issueCount,
          resolved_count: resolvedCount,
        };
      })
    );

    setStats({
      totalIssues: issues.length,
      totalUsers,
      avgResolutionDays: avgDays,
      cityTrustScore,
    });
    setDepartments(departmentsWithStats);
    setLoading(false);
  };

  if (!user || profile?.role !== 'admin') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="max-w-md">
          <CardContent className="p-8 text-center">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Admin Access Only
            </h2>
            <p className="text-gray-600 mb-6">
              This dashboard is only accessible to administrators
            </p>
            <Button onClick={() => onNavigate('home')}>Go Home</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin Dashboard</h1>
          <p className="text-gray-600">
            Comprehensive overview of platform performance and analytics
          </p>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
            <p className="mt-4 text-gray-600">Loading dashboard...</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Total Issues</p>
                      <p className="text-3xl font-bold text-blue-600">
                        {stats.totalIssues}
                      </p>
                    </div>
                    <div className="bg-blue-100 p-3 rounded-full">
                      <AlertCircle className="h-6 w-6 text-blue-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Total Users</p>
                      <p className="text-3xl font-bold text-green-600">
                        {stats.totalUsers}
                      </p>
                    </div>
                    <div className="bg-green-100 p-3 rounded-full">
                      <Users className="h-6 w-6 text-green-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Avg Resolution</p>
                      <p className="text-3xl font-bold text-orange-600">
                        {stats.avgResolutionDays}d
                      </p>
                    </div>
                    <div className="bg-orange-100 p-3 rounded-full">
                      <TrendingUp className="h-6 w-6 text-orange-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 mb-1">City Trust Score</p>
                      <p className="text-3xl font-bold text-cyan-600">
                        {stats.cityTrustScore}%
                      </p>
                    </div>
                    <div className="bg-cyan-100 p-3 rounded-full">
                      <Award className="h-6 w-6 text-cyan-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              <Card>
                <CardHeader>
                  <div className="flex items-center space-x-2">
                    <Building className="h-5 w-5 text-gray-700" />
                    <h2 className="text-xl font-semibold text-gray-900">
                      Department Performance
                    </h2>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {departments
                      .sort((a, b) => b.transparency_score - a.transparency_score)
                      .map((dept) => (
                        <div
                          key={dept.id}
                          className="border border-gray-200 rounded-lg p-4"
                        >
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <h3 className="font-semibold text-gray-900">{dept.name}</h3>
                              <p className="text-sm text-gray-600">
                                {dept.resolved_count} / {dept.issue_count} issues resolved
                              </p>
                            </div>
                            <Badge
                              variant={
                                dept.transparency_score >= 80
                                  ? 'high'
                                  : dept.transparency_score >= 60
                                  ? 'medium'
                                  : 'low'
                              }
                            >
                              {dept.transparency_score}% Trust
                            </Badge>
                          </div>
                          <div className="mt-3">
                            <div className="flex justify-between text-xs text-gray-600 mb-1">
                              <span>Transparency Score</span>
                              <span>{dept.transparency_score}%</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div
                                className={`h-2 rounded-full ${
                                  dept.transparency_score >= 80
                                    ? 'bg-green-500'
                                    : dept.transparency_score >= 60
                                    ? 'bg-yellow-500'
                                    : 'bg-red-500'
                                }`}
                                style={{ width: `${dept.transparency_score}%` }}
                              ></div>
                            </div>
                            <p className="text-xs text-gray-600 mt-2">
                              Avg Resolution: {dept.avg_resolution_days} days
                            </p>
                          </div>
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <div className="flex items-center space-x-2">
                    <UserCog className="h-5 w-5 text-gray-700" />
                    <h2 className="text-xl font-semibold text-gray-900">Quick Actions</h2>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <Button
                      className="w-full justify-start"
                      variant="secondary"
                      onClick={() => onNavigate('track')}
                    >
                      <AlertCircle className="mr-2 h-4 w-4" />
                      View All Issues
                    </Button>
                    <Button
                      className="w-full justify-start"
                      variant="secondary"
                      onClick={() => onNavigate('transparency')}
                    >
                      <TrendingUp className="mr-2 h-4 w-4" />
                      View Analytics & Transparency
                    </Button>
                    <Button
                      className="w-full justify-start"
                      variant="secondary"
                      onClick={() => onNavigate('heatmap')}
                    >
                      <Building className="mr-2 h-4 w-4" />
                      View Issue Heatmap
                    </Button>

                    <div className="mt-6 pt-6 border-t border-gray-200">
                      <h3 className="font-semibold text-gray-900 mb-3">System Health</h3>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Platform Status</span>
                          <Badge variant="high">Operational</Badge>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Database</span>
                          <Badge variant="high">Connected</Badge>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">AI Service</span>
                          <Badge variant="high">Active</Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Card, CardContent, CardHeader } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { TrendingUp, Award, BarChart3, Calendar } from 'lucide-react';

interface Department {
  id: string;
  name: string;
  transparency_score: number;
  avg_resolution_days: number;
  issue_count: number;
  resolved_count: number;
  avg_feedback_rating: number;
}

interface CategoryStats {
  category: string;
  total: number;
  resolved: number;
}

export function Transparency() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [categoryStats, setCategoryStats] = useState<CategoryStats[]>([]);
  const [cityStats, setCityStats] = useState({
    totalIssues: 0,
    resolvedIssues: 0,
    avgResolutionDays: 0,
    cityTrustScore: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTransparencyData();
  }, []);

  const fetchTransparencyData = async () => {
    const [issuesResult, departmentsResult, feedbackResult] = await Promise.all([
      supabase.from('issues').select('*'),
      supabase.from('departments').select('*'),
      supabase.from('issue_feedback').select('rating, issue_id'),
    ]);

    const issues = issuesResult.data || [];
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

    const categoryCounts: Record<string, { total: number; resolved: number }> = {};
    issues.forEach((issue) => {
      if (!categoryCounts[issue.category]) {
        categoryCounts[issue.category] = { total: 0, resolved: 0 };
      }
      categoryCounts[issue.category].total++;
      if (issue.status === 'resolved' || issue.status === 'closed') {
        categoryCounts[issue.category].resolved++;
      }
    });

    const categoryStatsArray = Object.entries(categoryCounts).map(([category, stats]) => ({
      category,
      total: stats.total,
      resolved: stats.resolved,
    }));

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

        const deptFeedbacks = feedbacks.filter((f) =>
          deptIssues?.some((issue) => issue.id === f.issue_id)
        );
        const avgFeedback =
          deptFeedbacks.length > 0
            ? deptFeedbacks.reduce((acc, f) => acc + f.rating, 0) / deptFeedbacks.length
            : 0;

        return {
          ...dept,
          issue_count: issueCount,
          resolved_count: resolvedCount,
          avg_feedback_rating: Math.round(avgFeedback * 10) / 10,
        };
      })
    );

    setCityStats({
      totalIssues: issues.length,
      resolvedIssues: resolvedIssues.length,
      avgResolutionDays: avgDays,
      cityTrustScore,
    });
    setDepartments(departmentsWithStats);
    setCategoryStats(categoryStatsArray);
    setLoading(false);
  };

  const resolutionRate =
    cityStats.totalIssues > 0
      ? Math.round((cityStats.resolvedIssues / cityStats.totalIssues) * 100)
      : 0;

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Transparency & Analytics
          </h1>
          <p className="text-gray-600">
            Public dashboard showing city-wide performance metrics and department accountability
          </p>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
            <p className="mt-4 text-gray-600">Loading transparency data...</p>
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
                        {cityStats.totalIssues}
                      </p>
                    </div>
                    <div className="bg-blue-100 p-3 rounded-full">
                      <BarChart3 className="h-6 w-6 text-blue-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Resolution Rate</p>
                      <p className="text-3xl font-bold text-green-600">{resolutionRate}%</p>
                    </div>
                    <div className="bg-green-100 p-3 rounded-full">
                      <TrendingUp className="h-6 w-6 text-green-600" />
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
                        {cityStats.avgResolutionDays}d
                      </p>
                    </div>
                    <div className="bg-orange-100 p-3 rounded-full">
                      <Calendar className="h-6 w-6 text-orange-600" />
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
                        {cityStats.cityTrustScore}%
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
                  <h2 className="text-xl font-semibold text-gray-900">
                    Department Performance Leaderboard
                  </h2>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {departments
                      .sort((a, b) => b.transparency_score - a.transparency_score)
                      .map((dept, index) => (
                        <div
                          key={dept.id}
                          className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg"
                        >
                          <div className="flex-shrink-0">
                            <div
                              className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white ${
                                index === 0
                                  ? 'bg-yellow-500'
                                  : index === 1
                                  ? 'bg-gray-400'
                                  : index === 2
                                  ? 'bg-orange-600'
                                  : 'bg-gray-300'
                              }`}
                            >
                              {index + 1}
                            </div>
                          </div>
                          <div className="flex-1">
                            <h3 className="font-semibold text-gray-900">{dept.name}</h3>
                            <div className="flex items-center space-x-4 text-sm text-gray-600 mt-1">
                              <span>
                                {dept.resolved_count}/{dept.issue_count} resolved
                              </span>
                              <span>Avg: {dept.avg_resolution_days}d</span>
                              <span>Rating: {dept.avg_feedback_rating}/5</span>
                            </div>
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
                            {dept.transparency_score}%
                          </Badge>
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <h2 className="text-xl font-semibold text-gray-900">
                    Issues by Category
                  </h2>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {categoryStats
                      .sort((a, b) => b.total - a.total)
                      .map((cat) => {
                        const percentage = Math.round((cat.resolved / cat.total) * 100);
                        return (
                          <div key={cat.category}>
                            <div className="flex justify-between items-center mb-2">
                              <span className="font-medium text-gray-900">
                                {cat.category}
                              </span>
                              <span className="text-sm text-gray-600">
                                {cat.resolved}/{cat.total} ({percentage}%)
                              </span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-3">
                              <div
                                className={`h-3 rounded-full transition-all ${
                                  percentage >= 80
                                    ? 'bg-green-500'
                                    : percentage >= 60
                                    ? 'bg-yellow-500'
                                    : 'bg-red-500'
                                }`}
                                style={{ width: `${percentage}%` }}
                              ></div>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card className="bg-gradient-to-r from-blue-600 to-cyan-600 border-none">
              <CardContent className="p-8 text-center">
                <h2 className="text-2xl font-bold text-white mb-3">
                  Transparency Score Methodology
                </h2>
                <p className="text-blue-50 text-sm max-w-3xl mx-auto">
                  Our transparency scores are calculated based on multiple factors: resolution
                  speed, citizen feedback ratings, escalation frequency, and communication
                  quality. This ensures accountability and drives continuous improvement in
                  public service delivery.
                </p>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}

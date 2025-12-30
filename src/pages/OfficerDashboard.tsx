import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Card, CardContent, CardHeader } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Select } from '../components/ui/Select';
import { Textarea } from '../components/ui/Textarea';
import { AlertCircle, CheckCircle, Clock, TrendingUp } from 'lucide-react';

interface Issue {
  id: string;
  title: string;
  description: string;
  category: string;
  ai_severity: 'low' | 'medium' | 'high' | null;
  priority_score: number;
  status: string;
  location_address: string | null;
  photo_url: string | null;
  submitted_at: string;
  escalated: boolean;
  submitter?: { full_name: string };
}

interface OfficerDashboardProps {
  onNavigate: (page: string) => void;
}

export function OfficerDashboard({ onNavigate }: OfficerDashboardProps) {
  const { user, profile } = useAuth();
  const [issues, setIssues] = useState<Issue[]>([]);
  const [stats, setStats] = useState({
    pending: 0,
    inProgress: 0,
    resolved: 0,
    overdue: 0,
  });
  const [loading, setLoading] = useState(true);
  const [updateModal, setUpdateModal] = useState<{
    show: boolean;
    issueId: string;
    status: string;
    notes: string;
  }>({
    show: false,
    issueId: '',
    status: '',
    notes: '',
  });

  useEffect(() => {
    if (user && profile?.role === 'officer') {
      fetchDashboardData();
    }
  }, [user, profile]);

  const fetchDashboardData = async () => {
    const { data: issuesData, error } = await supabase
      .from('issues')
      .select(`
        *,
        submitter:profiles!submitted_by(full_name)
      `)
      .order('priority_score', { ascending: false });

    if (error) {
      console.error('Error fetching issues:', error);
      setLoading(false);
      return;
    }

    setIssues(issuesData || []);

    const pending = issuesData?.filter(
      (i) => i.status === 'submitted' || i.status === 'acknowledged'
    ).length || 0;
    const inProgress = issuesData?.filter((i) => i.status === 'in_progress').length || 0;
    const resolved = issuesData?.filter(
      (i) => i.status === 'resolved' || i.status === 'closed'
    ).length || 0;

    const overdueCount = issuesData?.filter((i) => {
      if (i.status === 'resolved' || i.status === 'closed') return false;
      const submittedDate = new Date(i.submitted_at);
      const daysSince = (Date.now() - submittedDate.getTime()) / (1000 * 60 * 60 * 24);
      return daysSince > 7;
    }).length || 0;

    setStats({ pending, inProgress, resolved, overdue: overdueCount });
    setLoading(false);
  };

  const updateIssueStatus = async () => {
    if (!user || !updateModal.issueId) return;

    const updateData: any = {
      status: updateModal.status,
    };

    if (updateModal.status === 'acknowledged') {
      updateData.acknowledged_at = new Date().toISOString();
    } else if (updateModal.status === 'resolved') {
      updateData.resolved_at = new Date().toISOString();
      updateData.resolution_notes = updateModal.notes;
    }

    const { error: updateError } = await supabase
      .from('issues')
      .update(updateData)
      .eq('id', updateModal.issueId);

    if (!updateError) {
      await supabase.from('issue_timeline').insert({
        issue_id: updateModal.issueId,
        status: updateModal.status,
        notes: updateModal.notes,
        updated_by: user.id,
      });

      setUpdateModal({ show: false, issueId: '', status: '', notes: '' });
      fetchDashboardData();
    }
  };

  const statusOptions = [
    { value: 'acknowledged', label: 'Acknowledged' },
    { value: 'in_progress', label: 'In Progress' },
    { value: 'resolved', label: 'Resolved' },
    { value: 'closed', label: 'Closed' },
  ];

  if (!user || profile?.role !== 'officer') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="max-w-md">
          <CardContent className="p-8 text-center">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Officer Access Only
            </h2>
            <p className="text-gray-600 mb-6">
              This dashboard is only accessible to municipal officers
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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Officer Dashboard</h1>
          <p className="text-gray-600">Manage assigned issues and track performance</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Pending</p>
                  <p className="text-3xl font-bold text-orange-600">{stats.pending}</p>
                </div>
                <div className="bg-orange-100 p-3 rounded-full">
                  <Clock className="h-6 w-6 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">In Progress</p>
                  <p className="text-3xl font-bold text-blue-600">{stats.inProgress}</p>
                </div>
                <div className="bg-blue-100 p-3 rounded-full">
                  <TrendingUp className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Resolved</p>
                  <p className="text-3xl font-bold text-green-600">{stats.resolved}</p>
                </div>
                <div className="bg-green-100 p-3 rounded-full">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Overdue</p>
                  <p className="text-3xl font-bold text-red-600">{stats.overdue}</p>
                </div>
                <div className="bg-red-100 p-3 rounded-full">
                  <AlertCircle className="h-6 w-6 text-red-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
            <p className="mt-4 text-gray-600">Loading issues...</p>
          </div>
        ) : (
          <Card>
            <CardHeader>
              <h2 className="text-xl font-semibold text-gray-900">All Issues</h2>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {issues.map((issue) => (
                  <div
                    key={issue.id}
                    className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900">
                            {issue.title}
                          </h3>
                          {issue.escalated && (
                            <Badge variant="high">ESCALATED</Badge>
                          )}
                        </div>
                        <div className="flex flex-wrap gap-2 mb-2">
                          <Badge
                            variant={
                              issue.ai_severity as 'high' | 'medium' | 'low' | undefined
                            }
                          >
                            {issue.ai_severity?.toUpperCase() || 'PENDING'}
                          </Badge>
                          <Badge>{issue.category}</Badge>
                          <Badge className="bg-blue-50 text-blue-700 border-blue-200">
                            Priority: {issue.priority_score}
                          </Badge>
                        </div>
                        <p className="text-gray-700 text-sm mb-2">{issue.description}</p>
                        <p className="text-xs text-gray-500">
                          Reported by {issue.submitter?.full_name || 'Anonymous'} on{' '}
                          {new Date(issue.submitted_at).toLocaleDateString()}
                        </p>
                      </div>
                      {issue.photo_url && (
                        <img
                          src={issue.photo_url}
                          alt={issue.title}
                          className="w-24 h-24 object-cover rounded-lg ml-4"
                        />
                      )}
                    </div>
                    <div className="flex items-center justify-between">
                      <Badge
                        variant={
                          issue.status === 'resolved' || issue.status === 'closed'
                            ? 'resolved'
                            : issue.status === 'in_progress'
                            ? 'in_progress'
                            : 'submitted'
                        }
                      >
                        {issue.status.toUpperCase().replace('_', ' ')}
                      </Badge>
                      {issue.status !== 'resolved' && issue.status !== 'closed' && (
                        <Button
                          size="sm"
                          onClick={() =>
                            setUpdateModal({
                              show: true,
                              issueId: issue.id,
                              status: issue.status,
                              notes: '',
                            })
                          }
                        >
                          Update Status
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {updateModal.show && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="max-w-md w-full">
            <CardContent className="p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                Update Issue Status
              </h3>
              <Select
                label="New Status"
                options={statusOptions}
                value={updateModal.status}
                onChange={(e) =>
                  setUpdateModal((prev) => ({ ...prev, status: e.target.value }))
                }
              />
              <div className="mt-4">
                <Textarea
                  label="Notes"
                  rows={4}
                  value={updateModal.notes}
                  onChange={(e) =>
                    setUpdateModal((prev) => ({ ...prev, notes: e.target.value }))
                  }
                  placeholder="Add notes about this status update..."
                />
              </div>
              <div className="flex gap-3 mt-6">
                <Button onClick={updateIssueStatus} className="flex-1">
                  Update Status
                </Button>
                <Button
                  variant="secondary"
                  onClick={() =>
                    setUpdateModal({ show: false, issueId: '', status: '', notes: '' })
                  }
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

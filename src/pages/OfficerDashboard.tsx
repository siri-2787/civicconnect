import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Card, CardContent, CardHeader } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Select } from '../components/ui/Select';
import { Clock, TrendingUp, CheckCircle, AlertCircle } from 'lucide-react';

interface Issue {
  id: string;
  title: string;
  description: string;
  category: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  priority_score: number;
  department: string | null;
  created_at: string;
  submitter: { full_name: string };
}

interface OfficerDashboardProps {
  onNavigate: (page: string) => void;
}

export function OfficerDashboard({ onNavigate }: OfficerDashboardProps) {
  const { profile } = useAuth();
  const [issues, setIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(true);

  const [updateModal, setUpdateModal] = useState({
    show: false,
    issueId: '',
    status: 'open' as Issue['status'],
  });

  /* ---------------- FETCH DEPARTMENT ISSUES ---------------- */
  const fetchDepartmentIssues = async () => {
    if (!profile) return;

    setLoading(true);

    const { data, error } = await supabase
      .from('issues')
      .select(`
        id,
        title,
        description,
        category,
        status,
        priority_score,
        department,
        created_at,
        created_by:profiles!created_by(full_name)
      `)
      .eq('department', profile.department)
      .order('priority_score', { ascending: false });

    if (error) {
      console.error('Error fetching department issues:', error.message);
      setIssues([]);
    } else {
      setIssues(
        (data as any[]).map((i) => ({
          ...i,
          submitter: i.created_by,
        }))
      );
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchDepartmentIssues();
  }, [profile]);

  /* ---------------- CALCULATE STATS ---------------- */
  const stats = {
    pending: issues.filter((i) => i.status === 'open').length,
    inProgress: issues.filter((i) => i.status === 'in_progress').length,
    resolved: issues.filter((i) => i.status === 'resolved').length,
    overdue: issues.filter((i) => {
      if (i.status === 'resolved' || i.status === 'closed') return false;
      const days =
        (Date.now() - new Date(i.created_at).getTime()) /
        (1000 * 60 * 60 * 24);
      return days > 7;
    }).length,
  };

  /* ---------------- UPDATE ISSUE STATUS ---------------- */
  const updateIssueStatus = async () => {
    const { error } = await supabase
      .from('issues')
      .update({ status: updateModal.status })
      .eq('id', updateModal.issueId);

    if (error) {
      console.error('Error updating status:', error.message);
    } else {
      fetchDepartmentIssues(); // Refresh issues
    }

    setUpdateModal({ show: false, issueId: '', status: 'open' });
  };

  /* ---------------- UI ---------------- */
  if (!profile) {
    return <p>Loading profile...</p>;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">Officer Dashboard</h1>
        <p className="text-sm text-gray-500 mb-6">
          Department: <span className="font-medium">{profile.department}</span>
        </p>

        {/* STATS */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <StatCard title="Open" value={stats.pending} icon={<Clock />} />
          <StatCard title="In Progress" value={stats.inProgress} icon={<TrendingUp />} />
          <StatCard title="Resolved" value={stats.resolved} icon={<CheckCircle />} />
          <StatCard title="Overdue" value={stats.overdue} icon={<AlertCircle />} />
        </div>

        {/* ISSUES */}
        <Card>
          <CardHeader>
            <h2 className="text-xl font-semibold">Department Issues</h2>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p>Loading issues...</p>
            ) : issues.length === 0 ? (
              <p>No issues assigned to your department</p>
            ) : (
              issues.map((issue) => (
                <div key={issue.id} className="border rounded p-4 mb-4">
                  <h3 className="font-semibold text-lg">{issue.title}</h3>

                  <div className="flex gap-2 my-2 flex-wrap">
                    <Badge>{issue.category}</Badge>
                    <Badge>{issue.status.toUpperCase()}</Badge>
                    <Badge>Priority: {issue.priority_score}</Badge>
                  </div>

                  <p className="text-sm text-gray-600">{issue.description}</p>

                  <p className="text-xs text-gray-500 mt-1">
                    Reported by {issue.submitter?.full_name ?? 'Unknown'} on{' '}
                    {new Date(issue.created_at).toLocaleDateString()}
                  </p>

                  {issue.status !== 'closed' && (
                    <Button
                      size="sm"
                      className="mt-3"
                      onClick={() =>
                        setUpdateModal({
                          show: true,
                          issueId: issue.id,
                          status: issue.status,
                        })
                      }
                    >
                      Update Status
                    </Button>
                  )}
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {/* MODAL */}
      {updateModal.show && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center">
          <Card className="w-full max-w-md">
            <CardContent className="p-6">
              <Select
                label="Status"
                options={[
                  { value: 'open', label: 'Open' },
                  { value: 'in_progress', label: 'In Progress' },
                  { value: 'resolved', label: 'Resolved' },
                  { value: 'closed', label: 'Closed' },
                ]}
                value={updateModal.status}
                onChange={(e: any) =>
                  setUpdateModal((p) => ({ ...p, status: e.target.value }))
                }
              />

              <div className="flex gap-3 mt-6">
                <Button onClick={updateIssueStatus} className="flex-1">
                  Update
                </Button>
                <Button
                  variant="secondary"
                  onClick={() =>
                    setUpdateModal({ show: false, issueId: '', status: 'open' })
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

/* ---------------- STAT CARD ---------------- */
function StatCard({ title, value, icon }: any) {
  return (
    <Card>
      <CardContent className="p-6 flex justify-between items-center">
        <div>
          <p className="text-sm text-gray-500">{title}</p>
          <p className="text-3xl font-bold">{value}</p>
        </div>
        {icon}
      </CardContent>
    </Card>
  );
}





import { useState } from 'react';
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
  department: string;
  created_at: string;
  submitter: { full_name: string };
}

interface OfficerDashboardProps {
  onNavigate: (page: string) => void;
}

export function OfficerDashboard({ onNavigate }: OfficerDashboardProps) {
  // Static officer profile for demo
  const profile = {
    full_name: 'Demo Officer',
    role: 'officer' as const,
    department: 'Road',
  };

  // Static issues for demo
  const [issues, setIssues] = useState<Issue[]>([
    {
      id: 'demo-1',
      title: 'Pothole on Main Street',
      description: 'Large pothole causing traffic issues.',
      category: 'Road',
      status: 'open',
      priority_score: 5,
      department: 'Road',
      created_at: new Date().toISOString(),
      submitter: { full_name: 'John Doe' },
    },
    {
      id: 'demo-2',
      title: 'Street light not working',
      description: 'The street light near 5th avenue is not working.',
      category: 'Road',
      status: 'in_progress',
      priority_score: 3,
      department: 'Road',
      created_at: new Date().toISOString(),
      submitter: { full_name: 'Jane Smith' },
    },
  ]);

  const [updateModal, setUpdateModal] = useState({
    show: false,
    issueId: '',
    status: 'open' as Issue['status'],
  });

  // Calculate stats
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

  // Update issue status locally
  const updateIssueStatus = () => {
    setIssues((prev) =>
      prev.map((i) =>
        i.id === updateModal.issueId ? { ...i, status: updateModal.status } : i
      )
    );
    setUpdateModal({ show: false, issueId: '', status: 'open' });
  };

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
            {issues.length === 0 ? (
              <p>No issues assigned to your department</p>
            ) : (
              issues.map((issue) => (
                <div key={issue.id} className="border rounded p-4 mb-4">
                  <h3 className="font-semibold text-lg">{issue.title}</h3>

                  <div className="flex gap-2 my-2">
                    <Badge>{issue.category}</Badge>
                    <Badge>{issue.status.toUpperCase()}</Badge>
                    <Badge>Priority: {issue.priority_score}</Badge>
                  </div>

                  <p className="text-sm text-gray-600">{issue.description}</p>

                  <p className="text-xs text-gray-500 mt-1">
                    Reported by {issue.submitter.full_name} on{' '}
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

/* STAT CARD HELPER */
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




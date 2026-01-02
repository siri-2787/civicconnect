import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Card, CardContent } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { MapPin, Calendar } from 'lucide-react';

/* ---------------- TYPES ---------------- */

interface Issue {
  id: string;
  title: string;
  description: string;
  category: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  priority_score: number;
  location_text: string | null;
  photo_url: string | null; // ✅ ADDED
  created_at: string;
}

interface MyIssuesProps {
  onNavigate: (page: string) => void;
}

/* ---------------- COMPONENT ---------------- */

export function MyIssues({ onNavigate }: MyIssuesProps) {
  const { user } = useAuth();
  const [issues, setIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) fetchMyIssues();
  }, [user]);

  /* ---------------- FETCH ISSUES ---------------- */

  const fetchMyIssues = async () => {
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
        location_text,
        photo_url,
        created_at
      `)
      .eq('created_by', user!.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching issues:', error.message);
      setLoading(false);
      return;
    }

    setIssues(data || []);
    setLoading(false);
  };

  /* ---------------- AUTH CHECK ---------------- */

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Button onClick={() => onNavigate('login')}>Login</Button>
      </div>
    );
  }

  /* ---------------- UI ---------------- */

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">My Issues</h1>

        {loading ? (
          <p>Loading...</p>
        ) : issues.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-center">
              <p className="mb-4">No issues reported yet</p>
              <Button onClick={() => onNavigate('report')}>
                Report an Issue
              </Button>
            </CardContent>
          </Card>
        ) : (
          issues.map((issue) => (
            <Card key={issue.id} className="mb-4">
              <CardContent className="p-6">
                <h3 className="text-xl font-semibold">{issue.title}</h3>

                <div className="flex gap-2 my-2 flex-wrap">
                  <Badge>{issue.category}</Badge>
                  <Badge>{issue.status.toUpperCase()}</Badge>
                  <Badge>Priority {issue.priority_score}</Badge>
                </div>

                <p className="mb-3 text-gray-700">{issue.description}</p>

                {/* ✅ IMAGE DISPLAY */}
                {issue.photo_url && (
                  <img
                    src={issue.photo_url}
                    alt="Issue"
                    className="w-full max-h-64 object-cover rounded-lg border mb-4"
                  />
                )}

                <div className="flex gap-4 text-sm text-gray-600 flex-wrap">
                  {issue.location_text && (
                    <div className="flex items-center">
                      <MapPin className="h-4 w-4 mr-1" />
                      {issue.location_text}
                    </div>
                  )}
                  <div className="flex items-center">
                    <Calendar className="h-4 w-4 mr-1" />
                    {new Date(issue.created_at).toLocaleDateString()}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}

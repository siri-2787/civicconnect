import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Card, CardContent } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { MapPin, ThumbsUp, Calendar, User, Search, Filter } from 'lucide-react';

interface Issue {
  id: string;
  title: string;
  description: string;
  category: string;
  ai_severity: string | null;
  priority_score: number;
  status: string;
  location_text: string | null;
  created_at: string;
  vote_count?: number;
  user_voted?: boolean;
  submitter?: { full_name: string };
}

interface TrackIssuesProps {
  onNavigate: (page: string) => void;
}

export function TrackIssues({ onNavigate }: TrackIssuesProps) {
  const { user } = useAuth();
  const [issues, setIssues] = useState<Issue[]>([]);
  const [filteredIssues, setFilteredIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(true);

  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    fetchIssues();
  }, []);

  useEffect(() => {
    let filtered = [...issues];

    if (searchTerm) {
      filtered = filtered.filter(
        (i) =>
          i.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          i.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (categoryFilter) {
      filtered = filtered.filter((i) => i.category === categoryFilter);
    }

    if (statusFilter) {
      filtered = filtered.filter((i) => i.status === statusFilter);
    }

    setFilteredIssues(filtered);
  }, [searchTerm, categoryFilter, statusFilter, issues]);

  const fetchIssues = async () => {
    const { data, error } = await supabase
      .from('issues')
      .select(`*, submitter:profiles!created_by(full_name)`)
      .order('priority_score', { ascending: false });

    if (error) {
      console.error(error);
      setLoading(false);
      return;
    }

    const withVotes = await Promise.all(
      (data || []).map(async (issue) => {
        const { count } = await supabase
          .from('issue_votes')
          .select('*', { count: 'exact', head: true })
          .eq('issue_id', issue.id);

        let userVoted = false;
        if (user) {
          const { data: vote } = await supabase
            .from('issue_votes')
            .select('id')
            .eq('issue_id', issue.id)
            .eq('user_id', user.id)
            .maybeSingle();
          userVoted = !!vote;
        }

        return {
          ...issue,
          vote_count: count || 0,
          user_voted: userVoted,
        };
      })
    );

    setIssues(withVotes);
    setLoading(false);
  };

  const handleVote = async (issue: Issue) => {
    if (!user) return onNavigate('login');

    if (issue.user_voted) {
      await supabase
        .from('issue_votes')
        .delete()
        .eq('issue_id', issue.id)
        .eq('user_id', user.id);
    } else {
      await supabase.from('issue_votes').insert({
        issue_id: issue.id,
        user_id: user.id,
      });

      await supabase
        .from('issues')
        .update({ priority_score: issue.priority_score + 5 })
        .eq('id', issue.id);
    }

    fetchIssues();
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Track Issues</h1>

        <Card className="mb-6">
          <CardContent className="p-4 grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              placeholder="Search issues..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <Select
              options={[
                { value: '', label: 'All Categories' },
                { value: 'Road', label: 'Road' },
                { value: 'Sanitation', label: 'Sanitation' },
                { value: 'Water', label: 'Water' },
              ]}
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
            />
            <Select
              options={[
                { value: '', label: 'All Status' },
                { value: 'open', label: 'Open' },
                { value: 'resolved', label: 'Resolved' },
              ]}
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            />
          </CardContent>
        </Card>

        {loading ? (
          <p>Loading...</p>
        ) : (
          filteredIssues.map((issue) => (
            <Card key={issue.id} className="mb-4">
              <CardContent className="p-6">
                <h3 className="text-xl font-semibold">{issue.title}</h3>

                <div className="flex gap-2 my-2">
                  <Badge>{issue.category}</Badge>
                  <Badge>{issue.status.toUpperCase()}</Badge>
                  <Badge>Priority: {issue.priority_score}</Badge>
                </div>

                <p className="mb-3">{issue.description}</p>

                <div className="flex flex-wrap gap-4 text-sm text-gray-600 mb-4">
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
                  <div className="flex items-center">
                    <User className="h-4 w-4 mr-1" />
                    {issue.submitter?.full_name || 'Anonymous'}
                  </div>
                </div>

                <Button
  size="sm"
  onClick={() => handleVote(issue)}
  className={`flex items-center gap-2 ${
    issue.user_voted
      ? 'bg-green-600 text-white hover:bg-green-700'
      : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
  }`}
>
  <ThumbsUp className="h-4 w-4" />
  {issue.user_voted ? 'You are affected' : 'I am affected'}
  <span className="ml-2 text-sm">({issue.vote_count})</span>
</Button>

              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}

import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/Button';
import { Card, CardContent } from '../components/ui/Card';
import { supabase } from '../lib/supabase';
import {
  AlertCircle,
  CheckCircle,
  Clock,
  Users,
  TrendingUp,
  Award,
  MapPin,
  BarChart3,
} from 'lucide-react';

interface HomeProps {
  onNavigate: (page: string) => void;
}

interface Stats {
  totalIssues: number;
  resolvedIssues: number;
  activeUsers: number;
  avgResolutionDays: number;
}

export function Home({ onNavigate }: HomeProps) {
  const { user, profile } = useAuth();
  const [stats, setStats] = useState<Stats>({
    totalIssues: 0,
    resolvedIssues: 0,
    activeUsers: 0,
    avgResolutionDays: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    const [issuesResult, profilesResult] = await Promise.all([
      supabase.from('issues').select('id, status, submitted_at, resolved_at'),
      supabase.from('profiles').select('id'),
    ]);

    if (issuesResult.data && profilesResult.data) {
      const totalIssues = issuesResult.data.length;
      const resolvedIssues = issuesResult.data.filter(
        (i) => i.status === 'resolved' || i.status === 'closed'
      ).length;

      const resolvedWithDates = issuesResult.data.filter(
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

      setStats({
        totalIssues,
        resolvedIssues,
        activeUsers: profilesResult.data.length,
        avgResolutionDays: avgDays,
      });
    }

    setLoading(false);
  };

  const resolutionRate =
    stats.totalIssues > 0
      ? Math.round((stats.resolvedIssues / stats.totalIssues) * 100)
      : 0;

  const features = [
    {
      icon: AlertCircle,
      title: 'Report Issues',
      description: 'Easily report civic issues with location and photos',
      bg: 'bg-blue-100',
      text: 'text-blue-600',
    },
    {
      icon: TrendingUp,
      title: 'AI-Powered Classification',
      description: 'Automatic issue categorization and priority assessment',
      bg: 'bg-green-100',
      text: 'text-green-600',
    },
    {
      icon: Users,
      title: 'Community Voting',
      description: 'Vote on issues that affect you and your community',
      bg: 'bg-orange-100',
      text: 'text-orange-600',
    },
    {
      icon: Award,
      title: 'Transparency Score',
      description: 'Track department performance and accountability',
      bg: 'bg-cyan-100',
      text: 'text-cyan-600',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50">
      <div className="max-w-7xl mx-auto px-4 py-16">
        {/* HERO */}
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            Smart Governance for
            <span className="block text-blue-600">Sustainable Cities</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Empowering citizens to report civic issues and enabling transparent,
            AI-powered governance.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {user ? (
              profile?.role === 'citizen' ? (
                <>
                  <Button size="lg" onClick={() => onNavigate('report')}>
                    <AlertCircle className="mr-2 h-5 w-5" />
                    Report an Issue
                  </Button>

                  <Button
                    size="lg"
                    variant="secondary"
                    onClick={() => onNavigate('issues-near-me')}
                  >
                    <MapPin className="mr-2 h-5 w-5" />
                    Issues Near Me
                  </Button>
                </>
              ) : (
                <Button
                  size="lg"
                  onClick={() =>
                    onNavigate(
                      profile?.role === 'admin'
                        ? 'admin-dashboard'
                        : 'officer-dashboard'
                    )
                  }
                >
                  Go to Dashboard
                </Button>
              )
            ) : (
              <>
                <Button size="lg" onClick={() => onNavigate('signup')}>
                  Get Started
                </Button>
                <Button
                  size="lg"
                  variant="secondary"
                  onClick={() => onNavigate('transparency')}
                >
                  <BarChart3 className="mr-2 h-5 w-5" />
                  View Transparency
                </Button>
              </>
            )}
          </div>
        </div>

        {/* STATS */}
        {!loading && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-16">
            <StatCard title="Total Issues" value={stats.totalIssues} icon={AlertCircle} />
            <StatCard title="Resolved" value={stats.resolvedIssues} icon={CheckCircle} />
            <StatCard title="Resolution Rate" value={`${resolutionRate}%`} icon={TrendingUp} />
            <StatCard title="Avg Resolution" value={`${stats.avgResolutionDays}d`} icon={Clock} />
          </div>
        )}

        {/* FEATURES */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-center mb-12">
            Why CivicConnect?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div key={index} className="text-center">
                  <div
                    className={`inline-flex items-center justify-center w-16 h-16 rounded-full ${feature.bg} mb-4`}
                  >
                    <Icon className={`h-8 w-8 ${feature.text}`} />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600">{feature.description}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* CTA */}
        {!user && (
          <Card className="bg-gradient-to-r from-blue-600 to-cyan-600 border-none">
            <CardContent className="p-12 text-center">
              <h2 className="text-3xl font-bold text-white mb-4">
                Join the Movement for Better Cities
              </h2>
              <Button
                size="lg"
                variant="secondary"
                onClick={() => onNavigate('signup')}
              >
                Create Your Account
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

/* 🔹 Small reusable stat card */
function StatCard({
  title,
  value,
  icon: Icon,
}: {
  title: string;
  value: string | number;
  icon: any;
}) {
  return (
    <Card>
      <CardContent className="p-6 flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600">{title}</p>
          <p className="text-3xl font-bold">{value}</p>
        </div>
        <Icon className="h-6 w-6 text-blue-600" />
      </CardContent>
    </Card>
  );
}


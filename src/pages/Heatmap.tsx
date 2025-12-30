import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Card, CardContent, CardHeader } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { MapPin } from 'lucide-react';

interface AreaData {
  lat: number;
  lng: number;
  issueCount: number;
  resolvedCount: number;
  categories: Record<string, number>;
}

export function Heatmap() {
  const [areas, setAreas] = useState<AreaData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHeatmapData();
  }, []);

  /* ---------------- FETCH + PROCESS DATA ---------------- */
  const fetchHeatmapData = async () => {
    setLoading(true);

    const { data: issues, error } = await supabase
      .from('issues')
      .select('latitude, longitude, status, category')
      .not('latitude', 'is', null)
      .not('longitude', 'is', null);

    if (error) {
      console.error('Heatmap fetch error:', error);
      setLoading(false);
      return;
    }

    const areaMap: Record<string, AreaData> = {};

    issues?.forEach((issue) => {
      // group nearby issues (≈ 100–200m radius)
      const key = `${issue.latitude.toFixed(3)},${issue.longitude.toFixed(3)}`;

      if (!areaMap[key]) {
        areaMap[key] = {
          lat: issue.latitude,
          lng: issue.longitude,
          issueCount: 0,
          resolvedCount: 0,
          categories: {},
        };
      }

      areaMap[key].issueCount++;

      if (issue.status === 'resolved' || issue.status === 'closed') {
        areaMap[key].resolvedCount++;
      }

      areaMap[key].categories[issue.category] =
        (areaMap[key].categories[issue.category] || 0) + 1;
    });

    setAreas(Object.values(areaMap));
    setLoading(false);
  };

  /* ---------------- INTENSITY COLOR ---------------- */
  const getIntensityColor = (count: number, max: number) => {
    const intensity = Math.min((count / max) * 100, 100);
    if (intensity >= 75) return 'bg-red-500';
    if (intensity >= 50) return 'bg-orange-500';
    if (intensity >= 25) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const maxCount = Math.max(...areas.map((a) => a.issueCount), 1);

  /* ---------------- UI ---------------- */
  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Issue Heatmap</h1>
          <p className="text-gray-600">
            Visualize issue density based on reported locations
          </p>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-r-transparent"></div>
            <p className="mt-4 text-gray-600">Loading heatmap data...</p>
          </div>
        ) : (
          <>
            {/* Legend */}
            <Card className="mb-6">
              <CardContent className="p-6 flex justify-between items-center">
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">
                    Intensity Legend
                  </h3>
                  <div className="flex flex-wrap gap-4 text-sm">
                    <Legend color="bg-green-500" label="Low (0–25%)" />
                    <Legend color="bg-yellow-500" label="Medium (25–50%)" />
                    <Legend color="bg-orange-500" label="High (50–75%)" />
                    <Legend color="bg-red-500" label="Critical (75–100%)" />
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-600">Total Areas</p>
                  <p className="text-2xl font-bold">{areas.length}</p>
                </div>
              </CardContent>
            </Card>

            {/* Area Cards */}
            {areas.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">
                    No location data available yet
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {areas.map((area, idx) => {
                  const resolutionRate = Math.round(
                    (area.resolvedCount / area.issueCount) * 100
                  );

                  return (
                    <Card
                      key={idx}
                      className="hover:shadow-lg transition-shadow"
                    >
                      <CardHeader
                        className={`${getIntensityColor(
                          area.issueCount,
                          maxCount
                        )} text-white`}
                      >
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-2">
                            <MapPin className="h-5 w-5" />
                            <span className="font-semibold">
                              {area.lat.toFixed(3)}, {area.lng.toFixed(3)}
                            </span>
                          </div>
                          <Badge className="bg-white text-gray-900">
                            {area.issueCount} issues
                          </Badge>
                        </div>
                      </CardHeader>

                      <CardContent className="p-6">
                        {/* Resolution */}
                        <div className="mb-4">
                          <div className="flex justify-between text-sm mb-2">
                            <span className="text-gray-600">
                              Resolution Rate
                            </span>
                            <span className="font-medium">
                              {resolutionRate}%
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full ${
                                resolutionRate >= 80
                                  ? 'bg-green-500'
                                  : resolutionRate >= 60
                                  ? 'bg-yellow-500'
                                  : 'bg-red-500'
                              }`}
                              style={{ width: `${resolutionRate}%` }}
                            />
                          </div>
                        </div>

                        {/* Categories */}
                        <div>
                          <h4 className="text-sm font-semibold mb-2">
                            Top Categories
                          </h4>
                          <div className="space-y-1 text-sm">
                            {Object.entries(area.categories)
                              .sort(([, a], [, b]) => b - a)
                              .slice(0, 3)
                              .map(([cat, count]) => (
                                <div
                                  key={cat}
                                  className="flex justify-between"
                                >
                                  <span className="text-gray-600">{cat}</span>
                                  <span className="font-medium">{count}</span>
                                </div>
                              ))}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

/* ---------------- LEGEND COMPONENT ---------------- */
function Legend({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center">
      <div className={`w-4 h-4 rounded mr-2 ${color}`} />
      <span className="text-gray-600">{label}</span>
    </div>
  );
}

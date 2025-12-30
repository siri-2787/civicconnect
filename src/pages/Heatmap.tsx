import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Card, CardContent, CardHeader } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { MapPin } from 'lucide-react';

interface WardData {
  ward: string;
  issueCount: number;
  resolvedCount: number;
  categories: Record<string, number>;
}

export function Heatmap() {
  const [wardData, setWardData] = useState<WardData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHeatmapData();
  }, []);

  const fetchHeatmapData = async () => {
    const { data: issues, error } = await supabase
      .from('issues')
      .select('ward, status, category');

    if (error) {
      console.error('Error fetching heatmap data:', error);
      setLoading(false);
      return;
    }

    const wardMap: Record<string, WardData> = {};

    issues?.forEach((issue) => {
      const ward = issue.ward || 'Unknown';
      if (!wardMap[ward]) {
        wardMap[ward] = {
          ward,
          issueCount: 0,
          resolvedCount: 0,
          categories: {},
        };
      }

      wardMap[ward].issueCount++;
      if (issue.status === 'resolved' || issue.status === 'closed') {
        wardMap[ward].resolvedCount++;
      }

      if (!wardMap[ward].categories[issue.category]) {
        wardMap[ward].categories[issue.category] = 0;
      }
      wardMap[ward].categories[issue.category]++;
    });

    const wardDataArray = Object.values(wardMap).sort(
      (a, b) => b.issueCount - a.issueCount
    );

    setWardData(wardDataArray);
    setLoading(false);
  };

  const getIntensityColor = (count: number, max: number) => {
    const intensity = Math.min((count / max) * 100, 100);
    if (intensity >= 75) return 'bg-red-500';
    if (intensity >= 50) return 'bg-orange-500';
    if (intensity >= 25) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const maxCount = Math.max(...wardData.map((w) => w.issueCount), 1);

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Issue Heatmap</h1>
          <p className="text-gray-600">
            Visualize issue density across different wards and areas
          </p>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
            <p className="mt-4 text-gray-600">Loading heatmap data...</p>
          </div>
        ) : (
          <>
            <Card className="mb-6">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">Intensity Legend</h3>
                    <div className="flex items-center space-x-4 text-sm">
                      <div className="flex items-center">
                        <div className="w-4 h-4 bg-green-500 rounded mr-2"></div>
                        <span className="text-gray-600">Low (0-25%)</span>
                      </div>
                      <div className="flex items-center">
                        <div className="w-4 h-4 bg-yellow-500 rounded mr-2"></div>
                        <span className="text-gray-600">Medium (25-50%)</span>
                      </div>
                      <div className="flex items-center">
                        <div className="w-4 h-4 bg-orange-500 rounded mr-2"></div>
                        <span className="text-gray-600">High (50-75%)</span>
                      </div>
                      <div className="flex items-center">
                        <div className="w-4 h-4 bg-red-500 rounded mr-2"></div>
                        <span className="text-gray-600">Critical (75-100%)</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-600">Total Wards</p>
                    <p className="text-2xl font-bold text-gray-900">{wardData.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {wardData.map((ward) => {
                const resolutionRate = Math.round(
                  (ward.resolvedCount / ward.issueCount) * 100
                );
                return (
                  <Card key={ward.ward} className="hover:shadow-lg transition-shadow">
                    <CardHeader
                      className={`${getIntensityColor(
                        ward.issueCount,
                        maxCount
                      )} text-white`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <MapPin className="h-5 w-5" />
                          <h3 className="font-semibold">{ward.ward}</h3>
                        </div>
                        <Badge className="bg-white text-gray-900">
                          {ward.issueCount} issues
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="p-6">
                      <div className="mb-4">
                        <div className="flex justify-between text-sm mb-2">
                          <span className="text-gray-600">Resolution Rate</span>
                          <span className="font-medium text-gray-900">
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
                          ></div>
                        </div>
                      </div>

                      <div>
                        <h4 className="text-sm font-semibold text-gray-900 mb-2">
                          Top Categories
                        </h4>
                        <div className="space-y-2">
                          {Object.entries(ward.categories)
                            .sort(([, a], [, b]) => b - a)
                            .slice(0, 3)
                            .map(([category, count]) => (
                              <div
                                key={category}
                                className="flex justify-between text-sm"
                              >
                                <span className="text-gray-600">{category}</span>
                                <span className="font-medium text-gray-900">{count}</span>
                              </div>
                            ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {wardData.length === 0 && (
              <Card>
                <CardContent className="p-12 text-center">
                  <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No location data available yet</p>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>
    </div>
  );
}

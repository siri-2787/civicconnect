import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Card, CardContent, CardHeader } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { MapPin, Loader, AlertCircle } from 'lucide-react';

/* ---------------- TYPES ---------------- */

interface NearbyIssue {
  id: string;
  title: string;
  description: string;
  latitude: number;
  longitude: number;
  status: string;
  photo_url: string | null; // ✅ ADD THIS
  distance_km: number;
}

/* ---------------- COMPONENT ---------------- */

export default function IssuesNearMe() {
  const [issues, setIssues] = useState<NearbyIssue[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);

  const getUserLocation = () => {
    setError('');
    setLoading(true);

    if (!navigator.geolocation) {
      setError('Geolocation not supported');
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        setLocation({ lat, lng });

        await fetchNearbyIssues(lat, lng);
      },
      () => {
        setError('Location permission denied');
        setLoading(false);
      }
    );
  };

  const fetchNearbyIssues = async (lat: number, lng: number) => {
    const { data, error } = await supabase.rpc('get_issues_nearby', {
      user_lat: lat,
      user_lng: lng,
      radius_km: 5,
    });

    if (error) {
      setError(error.message);
    } else {
      setIssues(data || []);
    }

    setLoading(false);
  };

  /* ---------------- UI ---------------- */

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">Issues Near Me</h1>
        <p className="text-gray-600 mb-6">
          View civic issues reported near your current location
        </p>

        <Button onClick={getUserLocation} className="mb-6">
          <MapPin className="mr-2 h-4 w-4" />
          Detect My Location
        </Button>

        {loading && (
          <div className="flex items-center text-gray-600">
            <Loader className="animate-spin mr-2" /> Loading nearby issues...
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg flex items-center gap-2">
            <AlertCircle />
            {error}
          </div>
        )}

        {!loading && issues.length === 0 && location && (
          <p className="text-gray-600 mt-4">
            No issues found within 5 km radius.
          </p>
        )}

        <div className="grid gap-4 mt-6">
          {issues.map((issue) => (
            <Card key={issue.id}>
              <CardHeader>
                <h2 className="text-lg font-semibold">{issue.title}</h2>
                <p className="text-sm text-gray-500">
                  {issue.distance_km.toFixed(2)} km away
                </p>
              </CardHeader>

              <CardContent>
                <p className="text-gray-700 mb-3">{issue.description}</p>

                {/* ✅ IMAGE DISPLAY */}
                {issue.photo_url && (
                  <img
                    src={issue.photo_url}
                    alt="Issue"
                    className="w-full max-h-56 object-cover rounded-lg border mb-3"
                  />
                )}

                <span className="inline-block bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm">
                  Status: {issue.status}
                </span>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}


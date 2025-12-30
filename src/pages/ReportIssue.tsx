// ReportIssue.tsx
import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Textarea } from '../components/ui/Textarea';
import { Select } from '../components/ui/Select';
import { Card, CardContent, CardHeader } from '../components/ui/Card';
import { AlertCircle, MapPin, Loader } from 'lucide-react';

interface ReportIssueProps {
  onNavigate: (page: string) => void;
}

const categories = [
  { value: '', label: 'Select a category' },
  { value: 'Road', label: 'Road & Transport' },
  { value: 'Sanitation', label: 'Sanitation' },
  { value: 'Water', label: 'Water Supply' },
  { value: 'Safety', label: 'Public Safety' },
  { value: 'Electricity', label: 'Electricity' },
  { value: 'Waste', label: 'Waste Management' },
];

export function ReportIssue({ onNavigate }: ReportIssueProps) {
  const { user } = useAuth();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [locationText, setLocationText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card>
          <CardContent className="p-6 text-center">
            <AlertCircle className="mx-auto mb-3" />
            <p>Please login to report an issue</p>
            <Button onClick={() => onNavigate('login')}>Login</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const getCurrentLocation = () => {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLatitude(pos.coords.latitude);
        setLongitude(pos.coords.longitude);
        setLocationText(
          `${pos.coords.latitude.toFixed(5)}, ${pos.coords.longitude.toFixed(5)}`
        );
      },
      () => setError('Failed to fetch location')
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!title || !description || !category || !locationText) {
      setError('Please fill all required fields');
      setLoading(false);
      return;
    }

    const { error } = await supabase.from('issues').insert({
      title,
      description,
      category,
      latitude,
      longitude,
      location_text: locationText,
      created_by: user.id,
      status: 'open',
      priority_score: 0,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    setSuccess(true);
    setLoading(false);
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card>
          <CardContent className="p-6 text-center">
            <h2 className="text-xl font-bold mb-2">✅ Issue Submitted</h2>
            <Button onClick={() => onNavigate('home')}>Go Home</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <Card className="max-w-3xl mx-auto">
        <CardHeader>
          <h2 className="text-xl font-bold">Report Issue</h2>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && <p className="text-red-600">{error}</p>}

            <Select
              label="Category"
              options={categories}
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            />

            <Input label="Title" value={title} onChange={(e) => setTitle(e.target.value)} />

            <Textarea
              label="Description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />

            <Button type="button" variant="secondary" onClick={getCurrentLocation}>
              <MapPin className="mr-2" /> Use Current Location
            </Button>

            <Input
              label="Location"
              placeholder="Street / Area / Landmark"
              value={locationText}
              onChange={(e) => setLocationText(e.target.value)}
            />

            <Button type="submit" disabled={loading} className="w-full">
              {loading ? <Loader className="animate-spin" /> : 'Submit Issue'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

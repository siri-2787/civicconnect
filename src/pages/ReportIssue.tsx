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
  { value: '', label: 'Select category' },
  { value: 'Road', label: 'Road & Transport' },
  { value: 'Sanitation', label: 'Sanitation' },
  { value: 'Water', label: 'Water Supply' },
  { value: 'Electricity', label: 'Electricity' },
  { value: 'Safety', label: 'Public Safety' },
];

export function ReportIssue({ onNavigate }: ReportIssueProps) {
  const { user } = useAuth();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');

  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [locationText, setLocationText] = useState('');

  const [photo, setPhoto] = useState<File | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card>
          <CardContent className="p-6 text-center">
            <AlertCircle className="mx-auto mb-2" />
            <p>Please login to report an issue</p>
            <Button onClick={() => onNavigate('login')}>Login</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  /* ------------------ GET LOCATION + NAME ------------------ */

  const getCurrentLocation = () => {
    setError('');

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lon = pos.coords.longitude;

        setLatitude(lat);
        setLongitude(lon);

        // Reverse geocoding (OpenStreetMap – free)
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`
          );
          const data = await res.json();

          setLocationText(
            data.display_name ||
              `${lat.toFixed(5)}, ${lon.toFixed(5)}`
          );
        } catch {
          setLocationText(`${lat.toFixed(5)}, ${lon.toFixed(5)}`);
        }
      },
      () => setError('Failed to get location permission')
    );
  };

  /* ------------------ PHOTO UPLOAD ------------------ */

  const uploadPhoto = async (): Promise<string | null> => {
    if (!photo) return null;

    const ext = photo.name.split('.').pop();
    const filePath = `${user.id}/${Date.now()}.${ext}`;

    const { error } = await supabase.storage
      .from('issue-photos')
      .upload(filePath, photo);

    if (error) {
      setError('Photo upload failed');
      return null;
    }

    const { data } = supabase.storage
      .from('issue-photos')
      .getPublicUrl(filePath);

    return data.publicUrl;
  };

  /* ------------------ SUBMIT ISSUE ------------------ */

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!title || !description || !category || !locationText) {
      setError('Please fill all required fields');
      setLoading(false);
      return;
    }

    const photoUrl = await uploadPhoto();

    const { error } = await supabase.from('issues').insert({
      title,
      description,
      category,
      latitude,
      longitude,
      location_text: locationText, // 👈 USED IN TRACK ISSUE
      photo_url: photoUrl,
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

  /* ------------------ SUCCESS ------------------ */

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

  /* ------------------ UI ------------------ */

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <Card className="max-w-3xl mx-auto">
        <CardHeader>
          <h2 className="text-xl font-bold">Report an Issue</h2>
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

            <Input
              label="Title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />

            <Textarea
              label="Description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />

            <Button type="button" variant="secondary" onClick={getCurrentLocation}>
              <MapPin className="mr-2" /> Use Current Location
            </Button>

            <Input
              label="Location (Editable)"
              placeholder="Street / Area / Landmark"
              value={locationText}
              onChange={(e) => setLocationText(e.target.value)}
            />

            <div>
              <label className="block text-sm font-medium mb-1">
                Upload Photo (optional)
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setPhoto(e.target.files?.[0] || null)}
                className="w-full border rounded p-2"
              />
            </div>

            <Button type="submit" disabled={loading} className="w-full">
              {loading ? <Loader className="animate-spin" /> : 'Submit Issue'}
            </Button>

          </form>
        </CardContent>
      </Card>
    </div>
  );
}

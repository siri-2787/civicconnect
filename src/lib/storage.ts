import { supabase } from './supabase';

export async function uploadIssuePhoto(file: File, issueId: string) {
  const fileExt = file.name.split('.').pop();
  const fileName = `${issueId}.${fileExt}`;
  const filePath = `issues/${fileName}`;

  const { error } = await supabase.storage
    .from('issue-photos')
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: true,
    });

  if (error) throw error;

  const { data } = supabase.storage
    .from('issue-photos')
    .getPublicUrl(filePath);

  return data.publicUrl;
}

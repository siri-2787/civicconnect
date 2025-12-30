import { createClient } from 'npm:@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

interface IssueClassificationRequest {
  issueId: string;
  title: string;
  description: string;
  category: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const geminiApiKey = Deno.env.get('GEMINI_API_KEY');

    const supabase = createClient(supabaseUrl, supabaseKey);

    const { issueId, title, description, category }: IssueClassificationRequest = await req.json();

    let aiDetectedCategory = category;
    let aiSeverity: 'low' | 'medium' | 'high' = 'medium';
    let aiSuggestedDepartment = '';
    let aiSuggestions: any = {};
    let priorityScore = 50;

    if (geminiApiKey) {
      const prompt = `Analyze the following civic issue and provide:
1. Severity level (low/medium/high)
2. Most appropriate department
3. Priority score (0-100)
4. Brief solution suggestions

Title: ${title}
Description: ${description}
Reported Category: ${category}

Respond in JSON format with keys: severity, department, priorityScore, suggestions`;

      try {
        const geminiResponse = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${geminiApiKey}`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              contents: [{
                parts: [{ text: prompt }]
              }]
            }),
          }
        );

        if (geminiResponse.ok) {
          const geminiData = await geminiResponse.json();
          const responseText = geminiData.candidates[0]?.content?.parts[0]?.text || '{}';
          
          const jsonMatch = responseText.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            const aiResponse = JSON.parse(jsonMatch[0]);
            aiSeverity = (aiResponse.severity || 'medium').toLowerCase();
            aiSuggestedDepartment = aiResponse.department || '';
            priorityScore = aiResponse.priorityScore || 50;
            aiSuggestions = aiResponse.suggestions || {};
          }
        }
      } catch (error) {
        console.error('Gemini API error:', error);
      }
    }

    const severityScores = { low: 30, medium: 50, high: 80 };
    const basePriority = severityScores[aiSeverity];
    
    const { data: voteCount } = await supabase
      .from('issue_votes')
      .select('id', { count: 'exact', head: true })
      .eq('issue_id', issueId);

    const voteBonus = (voteCount || 0) * 5;
    priorityScore = Math.min(100, basePriority + voteBonus);

    const departmentMap: Record<string, string> = {
      'Road': 'Roads & Transport',
      'Sanitation': 'Sanitation',
      'Water': 'Water Supply',
      'Safety': 'Public Safety',
      'Electricity': 'Electricity',
      'Waste': 'Waste Management',
    };

    if (!aiSuggestedDepartment) {
      aiSuggestedDepartment = departmentMap[category] || 'General';
    }

    const { data: department } = await supabase
      .from('departments')
      .select('id')
      .eq('name', aiSuggestedDepartment)
      .maybeSingle();

    await supabase
      .from('issues')
      .update({
        ai_detected_category: aiDetectedCategory,
        ai_severity: aiSeverity,
        ai_suggested_department: aiSuggestedDepartment,
        ai_suggestions: aiSuggestions,
        priority_score: priorityScore,
        assigned_to_department: department?.id || null,
      })
      .eq('id', issueId);

    return new Response(
      JSON.stringify({
        success: true,
        category: aiDetectedCategory,
        severity: aiSeverity,
        department: aiSuggestedDepartment,
        priorityScore,
        suggestions: aiSuggestions,
      }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  }
});
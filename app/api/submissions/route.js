import { createClient } from '@supabase/supabase-js';

let supabase = null;
function getSupabase() {
    if (!supabase) {
        supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL,
            process.env.SUPABASE_SERVICE_ROLE_KEY
        );
    }
    return supabase;
}

const TEACHER_PASSWORD = 'teacher2024';

export async function GET(request) {
    const authHeader = request.headers.get('x-teacher-password');
    if (authHeader !== TEACHER_PASSWORD) {
        return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { data, error } = await getSupabase()
            .from('submissions')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;
        return Response.json({ data: data || [] });
    } catch (error) {
        console.error('Failed to fetch submissions:', error);
        return Response.json({ error: 'Failed to fetch submissions' }, { status: 500 });
    }
}

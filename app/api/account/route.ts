import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

export async function PUT(req: NextRequest) {
  // Create a Supabase client specifically for this Route Handler
  const cookieStore = cookies();
  const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
  
  // Get the session directly in this route
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  const userId = session.user.id;
  const body = await req.json();

  // Only allow updating these fields
  const { name, company, website, email, phone } = body;

  const { error } = await supabase
    .from('users')
    .update({ name, company, website, email, phone })
    .eq('id', userId);

  if (error) {
    console.error('Error updating user:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  
  return NextResponse.json({ success: true });
}

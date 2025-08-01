"use client";
import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { supabase, onAuthStateChange } from '@/lib/auth';
import { triggerVectorstoreCreation } from '@/lib/vectorstore';
import AnimatedLogoSprout from "@/components/AnimatedLogoSprout";

// Separate component to use searchParams within Suspense boundary
function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirectedFrom") || "/dashboard";
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true); // Start with loading true

  // Check session and set up auth state listener
  useEffect(() => {
    // Initial session check
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const { data: aiRows } = await supabase
          .from('business_info')
          .select('id')
          .eq('user_id', session.user.id)
          .order('created_at', { ascending: false })
          .limit(1);
        if (aiRows && aiRows.length > 0) {
          router.replace(`/dashboard/info?aiId=${aiRows[0].id}`);
        } else {
          router.replace('/dashboard');
        }
        return;
      }
      setLoading(false); // Set loading to false after initial check
    };

    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        (async () => {
          const { data: aiRows } = await supabase
            .from('business_info')
            .select('id')
            .eq('user_id', session.user.id)
            .order('created_at', { ascending: false })
            .limit(1);
          if (aiRows && aiRows.length > 0) {
            router.replace(`/dashboard/info?aiId=${aiRows[0].id}`);
          } else {
            router.replace('/dashboard');
          }
        })();
      }
    });

    checkSession();

    // Cleanup subscription
    return () => {
      subscription.unsubscribe();
    };
  }, [router]);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      if (data?.session) {
        const userId = data.session.user.id;
        const userEmail = data.session.user.email;
        const userMeta = data.session.user.user_metadata || {};
        console.log('[LOGIN] Session user:', { userId, userEmail, userMeta });
        // 1. Check if user already exists in public.users
        const { data: userRow, error: userError } = await supabase
          .from('users')
          .select('id')
          .eq('id', userId)
          .single();
        console.log('[LOGIN] userRow:', userRow, 'userError:', userError);
        if ((!userRow && !userError) || (userError && userError.code === 'PGRST116')) { // PGRST116: No rows found
          console.log('[LOGIN] No user row found, attempting insert...');
          // Insert user profile
          const insertPayload = {
            id: userId,
            name: userMeta.first_name || userMeta.full_name || userEmail?.split('@')[0] || 'User',
            email: userEmail,
            avatar_url: userMeta.avatar_url || null,
            plan: 'free',
            billing_info: null,
            email_verified: true,
            company: userMeta.company || '',
            phone: userMeta.phone || '',
            website: userMeta.website || '',
          };
          console.log('[LOGIN] Insert payload for users:', insertPayload);
          const { error: insertError } = await supabase.from('users').insert([insertPayload]);
          if (insertError) {
            console.error('[LOGIN] Profile creation failed:', insertError);
            setLoading(false);
            setError('Profile creation failed: ' + insertError.message);
            return;
          }
          console.log('[LOGIN] User profile insert successful.');
          // Insert default business_info
          const aiName = userMeta.full_name || (userEmail?.split('@')[0] + "'s AI");
          // Use pendingBusinessInfo from localStorage if available
          let businessInfoPayload = {
            user_id: userId,
            ai_name: userMeta.first_name || userEmail.split('@')[0] + "'s AI",
            company_name: userMeta.company || "",
            website: userMeta.website || "",
            email: userEmail,
            calendar_link: null,
            phone_number: userMeta.phone || "",
            agent_type: "information-education",
            branding: null,
            heading_title_color: '#FFFFFF',
            heading_background_color: '#4285F4',
            ai_message_color: '#000000',
            ai_message_background_color: '#F1F1F1',
            user_message_color: '#FFFFFF',
            user_message_background_color: '#4285F4',
            widget_color: '#4285F4',
            send_button_color: '#4285F4',
            start_minimized: false,
            vectorstore_ready: false,
          };
          if (typeof window !== 'undefined') {
            const pending = localStorage.getItem('pendingBusinessInfo');
            if (pending) {
              try {
                const parsed = JSON.parse(pending);
                // Map company to company_name if present
                if (parsed.company) {
                  parsed.company_name = parsed.company;
                  delete parsed.company;
                }
                // Only allow keys that exist in business_info schema
                const allowedKeys = [
                  "user_id", "ai_name", "company_name", "website", "email", "calendar_link",
                  "phone_number", "agent_type", "branding", "heading_title_color", "heading_background_color",
                  "ai_message_color", "ai_message_background_color", "user_message_color",
                  "user_message_background_color", "widget_color", "send_button_color",
                  "start_minimized", "vectorstore_ready"
                ];
                Object.keys(parsed).forEach(key => {
                  if (!allowedKeys.includes(key)) {
                    delete parsed[key];
                  }
                });
                businessInfoPayload = {
                  ...businessInfoPayload,
                  ...parsed,
                };
                localStorage.removeItem('pendingBusinessInfo');
              } catch (e) {
                console.warn('Could not parse pendingBusinessInfo:', e);
              }
            }
          }
          console.log('[LOGIN] Insert payload for business_info:', businessInfoPayload);
          const { data: insertedRow, error: businessInfoError } = await supabase
            .from('business_info')
            .insert([businessInfoPayload])
            .select()
            .single();
          if (businessInfoError) {
            console.error('[LOGIN] Business info creation failed:', businessInfoError);
            setLoading(false);
            setError('Business info creation failed: ' + businessInfoError.message);
            return;
          }
          console.log('[LOGIN] Business info insert successful.', insertedRow);
          // Trigger vectorstore creation right after business_info insert
          if (insertedRow && insertedRow.id) {
            console.log('[DEBUG] Calling triggerVectorstoreCreation after signup', insertedRow.id, insertedRow.session_cookie);
            triggerVectorstoreCreation(insertedRow.id, insertedRow.session_cookie).then(res => {
              console.log('[DEBUG] triggerVectorstoreCreation result:', res);
            });
          }
        }
        // Continue with dashboard redirect
        const { data: aiRows, error: aiError } = await supabase
          .from('business_info')
          .select('id')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(1);
        console.log('[LOGIN] aiRows:', aiRows, 'aiError:', aiError);
        if (aiRows && aiRows.length > 0) {
          router.replace(`/dashboard/info?aiId=${aiRows[0].id}`);
        } else {
          router.replace('/dashboard');
        }
      } else {
        throw new Error("No session established");
      }
    } catch (err: any) {
      // Only log unexpected errors
      if (err?.message === "Invalid login credentials") {
        setError("Invalid email or password. Please try again.");
      } else if (err?.message === "Email not confirmed") {
        setError("Please confirm your email address before logging in. Check your inbox for a confirmation link.");
      } else {
        // Log unexpected errors
        console.error('Unexpected login error:', err);
        setError("An unexpected error occurred. Please try again later.");
      }
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-400 via-green-600 to-green-900">
      {/* Mobile-specific styling to match desktop experience */}
      <style jsx global>{`
        /* Mobile-specific overrides to match desktop experience */
        @media (max-width: 767px) {
          /* Force inputs to have white background and dark text on mobile */
          input, select, textarea {
            -webkit-appearance: none;
            -moz-appearance: none;
            appearance: none;
            background-color: #ffffff !important;
            color: #111827 !important; /* text-gray-900 */
            opacity: 1 !important;
          }
          
          /* Fix autofill styling on mobile */
          input:-webkit-autofill,
          input:-webkit-autofill:hover,
          input:-webkit-autofill:focus,
          input:-webkit-autofill:active {
            -webkit-text-fill-color: #111827 !important;
            -webkit-box-shadow: 0 0 0 30px white inset !important;
            transition: background-color 5000s ease-in-out 0s;
          }
          
          /* Fix label color on mobile */
          label, .text-sm, .text-xs {
            color: #111827 !important; /* text-gray-900 */
          }
          
          /* Ensure form labels are visible against the background */
          form label {
            color: #111827 !important; /* text-gray-900 */
            font-weight: 500 !important;
          }
          
          /* Fix card transparency issues on mobile */
          .card, .bg-white, .bg-white\/90 {
            background-color: #ffffff !important;
            backdrop-filter: none !important;
          }
          
          /* Fix login form element styles */
          .form-input, input[type="email"], input[type="password"] {
            background-color: #ffffff !important;
            color: #111827 !important;
            border: 1px solid #d1d5db !important;
          }
        }
      `}</style>
      <Card className="w-full max-w-md shadow-xl rounded-2xl border-0 bg-white/90">
        <CardContent className="p-8">
          <div className="mb-8 text-center">
            <div className="flex flex-col items-center mb-2">
  <AnimatedLogoSprout size={56} />
  <div className="font-bold text-xl text-green-800 tracking-tight mt-2">growbro.ai</div>
</div>
            <h1 className="text-2xl font-bold text-green-700">Welcome Back!</h1>
            <p className="text-green-500">Login to your AI-powered CRM</p>
          </div>
          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" autoComplete="email" required value={email} onChange={e => setEmail(e.target.value)} className="mt-1" />
            </div>
            <div>
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" autoComplete="current-password" required value={password} onChange={e => setPassword(e.target.value)} className="mt-1" />
            </div>
            {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}
            <Button type="submit" className="w-full bg-green-700 hover:bg-green-800 text-white font-semibold" disabled={loading}>{loading ? "Logging in..." : "Login"}</Button>
          </form>
          <div className="text-right mt-2">
            <Link 
              href="/forgot-password" 
              className="text-green-600 text-sm hover:underline"
              onClick={(e) => {
                console.log('Forgot Password link clicked');
                e.stopPropagation();
              }}
            >
              Forgot Password?
            </Link>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col items-center gap-2 pb-6">
          <span className="text-sm text-gray-600">No account? <Link href="/signup" className="text-green-700 font-semibold hover:underline">Sign up</Link></span>
        </CardFooter>
      </Card>
    </div>
  );
}

export default function LoginPage() {
  
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-400 via-green-600 to-green-900">
      <Card className="w-full max-w-md shadow-xl rounded-2xl border-0 bg-white/90">
        <CardContent className="p-8 flex justify-center items-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-green-700 mx-auto mb-4"></div>
            <p>Loading...</p>
          </div>
        </CardContent>
      </Card>
    </div>}>
      <LoginContent />
    </Suspense>
  );
}

"use client";
import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { supabase, onAuthStateChange } from '@/lib/auth';
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
        // Fetch most recent business_info for this user
        const { data: aiRows, error: aiError } = await supabase
          .from('business_info')
          .select('id')
          .eq('user_id', data.session.user.id)
          .order('created_at', { ascending: false })
          .limit(1);
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
            <a href="/forgot-password" className="text-green-600 text-sm hover:underline">Forgot Password?</a>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col items-center gap-2 pb-6">
          <span className="text-sm text-gray-600">No account? <a href="/signup" className="text-green-700 font-semibold hover:underline">Sign up</a></span>
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

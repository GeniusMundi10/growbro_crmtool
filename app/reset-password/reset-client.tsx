"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { Loader2 } from "lucide-react";

export default function ResetClient() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<"verifying" | "valid" | "invalid">("verifying");
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClientComponentClient();

  // Handle the password reset token when the component mounts
  useEffect(() => {
    const handleResetPassword = async () => {
      try {
        setLoading(true);
        setStatus('verifying');
        setError(null);

        // Robustly get parameters from both hash and query string
        const hash = window.location.hash.substring(1);
        const params = new URLSearchParams(hash);

        const accessToken = params.get('access_token') || searchParams.get('access_token');
        let refreshToken = params.get('refresh_token') || searchParams.get('refresh_token');
        if (refreshToken === "") refreshToken = null;
        const type = params.get('type') || searchParams.get('type');
        const next = params.get('next') || searchParams.get('next') || '/dashboard';

        // DEBUG LOGGING
        console.log('DEBUG: accessToken:', accessToken);
        console.log('DEBUG: refreshToken:', refreshToken);
        console.log('DEBUG: type:', type);
        console.log('DEBUG: full window.location.href:', window.location.href);
        console.log('DEBUG: full window.location.hash:', window.location.hash);
        console.log('DEBUG: full searchParams:', searchParams.toString());

        console.log('Reset password params:', { 
          accessToken: accessToken ? '***' : 'missing', 
          refreshToken: refreshToken ? '***' : 'missing',
          type,
          next
        });

        if (type !== 'recovery' || !accessToken) {
          const errorMsg = !accessToken ? 'Missing access token' : `Invalid type: ${type}`;
          console.error('Invalid reset link:', errorMsg);
          throw new Error('Invalid or expired reset link');
        }

        console.log('Setting session with tokens...');
        
        // Set the session using the tokens from the URL
        const { data, error: sessionError } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken || ''
        });

        console.log('Session set response:', { 
          data: data ? 'Session data received' : 'No session data',
          error: sessionError ? sessionError.message : 'No error'
        });

        if (sessionError) {
          console.error('Error setting session:', sessionError);
          throw new Error('Failed to verify reset link. Please request a new one.');
        }

        setStatus('valid');
      } catch (err: any) {
        setError(err.message || 'An error occurred');
        setStatus('invalid');
      } finally {
        setLoading(false);
      }
    };

    handleResetPassword();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ...rest of your component, such as the form for entering new password
  // For brevity, not including the full form markup here, but you should move it from your original page.tsx

  return (
    <div>
      {/* Render your password reset form and status here */}
      {/* Example status handling: */}
      {status === 'verifying' && (
        <div className="flex items-center gap-2"><Loader2 className="animate-spin" /> Verifying link…</div>
      )}
      {status === 'invalid' && (
        <div className="text-red-500">{error || 'Invalid or expired reset link.'}</div>
      )}
      {status === 'valid' && (
        <form>
          {/* Your password form fields here */}
          <Label htmlFor="password">New password</Label>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
          />
          <Label htmlFor="confirmPassword">Confirm new password</Label>
          <Input
            id="confirmPassword"
            type="password"
            value={confirmPassword}
            onChange={e => setConfirmPassword(e.target.value)}
            required
          />
          <Button type="submit" disabled={loading}>
            {loading ? <Loader2 className="animate-spin" /> : 'Reset Password'}
          </Button>
        </form>
      )}
    </div>
  );
}

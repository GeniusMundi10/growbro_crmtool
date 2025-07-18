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

        console.log('Verifying OTP for password recovery...');
        
        // Extract email for verifyOtp
        const email = params.get('email') || searchParams.get('email');
        // Use verifyOtp instead of setSession
        const verifyOtpParams: any = {
          type: 'recovery',
          token: accessToken,
        };
        if (email) verifyOtpParams.email = email;
        const { data, error: otpError } = await supabase.auth.verifyOtp(verifyOtpParams);

        console.log('OTP verification response:', { data, error: otpError });

        if (otpError) {
          console.error('Error verifying OTP:', otpError);
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
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md bg-white rounded-lg shadow-lg p-8 flex flex-col gap-6">
        <h1 className="text-2xl font-bold text-center mb-2">Reset your password</h1>
        {status === 'verifying' && (
          <div className="flex items-center gap-2 justify-center text-gray-500"><Loader2 className="animate-spin" /> Verifying link…</div>
        )}
        {status === 'invalid' && (
          <div className="text-red-500 text-center">{error || 'Invalid or expired reset link.'}</div>
        )}
        {status === 'valid' && (
          <form className="flex flex-col gap-4" onSubmit={async (e) => {
          e.preventDefault();
          setLoading(true);
          setError(null);
          if (password !== confirmPassword) {
            setError("Passwords do not match.");
            setLoading(false);
            return;
          }
          if (password.length < 8) {
            setError("Password must be at least 8 characters.");
            setLoading(false);
            return;
          }
          const { error: updateError } = await supabase.auth.updateUser({ password });
          if (updateError) {
            setError(updateError.message || "Failed to update password.");
            setLoading(false);
            return;
          }
          toast("Password updated successfully! Please log in with your new password.");
          setLoading(false);
          router.push("/login");
        }}>
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
    </div>
  );
}

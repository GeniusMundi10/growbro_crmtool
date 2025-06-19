"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { Loader2 } from "lucide-react";

export default function ResetPasswordPage() {
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

        // Get the access token from the URL hash or query params
        const hash = window.location.hash.substring(1);
        const params = new URLSearchParams(hash);
        const accessToken = params.get('access_token') || searchParams.get('access_token');
        const refreshToken = params.get('refresh_token') || searchParams.get('refresh_token');
        const type = params.get('type');
        const next = searchParams.get('next') || '/dashboard';

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

        // Clear the URL hash/query params after successful session set
        window.history.replaceState({}, document.title, '/reset-password');

        if (sessionError) throw sessionError;

        // Clean up the URL
        window.history.replaceState({}, document.title, window.location.pathname);
        setStatus("valid");
      } catch (error) {
        console.error('Error processing reset link:', error);
        setStatus("invalid");
        setError('Failed to process reset link. Please request a new one.');
      }
    };

    handleResetPassword();
  }, [supabase.auth, searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (status !== 'valid') {
      setError('Invalid or expired reset link');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      console.log('Attempting to update password...');
      
      // First verify we still have a valid session
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Your session has expired. Please request a new password reset link.');
      }
      
      // Update the password
      const { error } = await supabase.auth.updateUser({
        password: password,
      });

      if (error) throw error;
      
      console.log('Password updated successfully');
      toast.success("Password updated successfully! You can now log in with your new password.");
      
      // Sign out the user after password reset
      await supabase.auth.signOut();
      
      // Redirect to login after a short delay
      setTimeout(() => {
        router.push("/login");
      }, 2000);
      
    } catch (error: any) {
      console.error("Error updating password:", error);
      const errorMessage = error.message.includes('invalid_grant') 
        ? 'Your password reset link has expired. Please request a new one.'
        : error.message || 'An error occurred while updating your password';
      
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Show loading state while verifying the token
  if (status === 'verifying') {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
        <div className="flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-green-600" />
        </div>
        <p className="mt-4 text-sm text-gray-600">Verifying your reset link...</p>
      </div>
    );
  }

  // Show error if token is invalid
  if (status === 'invalid') {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
        <div className="w-full max-w-md space-y-8">
          <div>
            <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
              Invalid Reset Link
            </h2>
            <p className="mt-2 text-center text-sm text-gray-600">
              The password reset link is invalid or has expired. Please request a new one.
            </p>
          </div>
          <div className="mt-6">
            <Button
              onClick={() => router.push('/forgot-password')}
              className="group relative flex w-full justify-center rounded-md bg-green-600 px-3 py-2 text-sm font-semibold text-white hover:bg-green-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-600"
            >
              Request New Reset Link
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Show the password reset form
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Reset your password
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Enter your new password below
          </p>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4 rounded-md shadow-sm">
            <div>
              <Label htmlFor="password" className="sr-only">
                New Password
              </Label>
              <Input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                className="relative block w-full rounded-md border-0 py-1.5 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-green-600 sm:text-sm sm:leading-6"
                placeholder="New Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="confirmPassword" className="sr-only">
                Confirm Password
              </Label>
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
                required
                className="relative block w-full rounded-md border-0 py-1.5 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-green-600 sm:text-sm sm:leading-6"
                placeholder="Confirm New Password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>
          </div>

          {error && (
            <div className="rounded-md bg-red-50 p-4">
              <div className="flex">
                <div className="ml-3">
                  <p className="text-sm font-medium text-red-800">{error}</p>
                </div>
              </div>
            </div>
          )}

          <div>
            <Button
              type="submit"
              className="group relative flex w-full justify-center rounded-md bg-green-600 px-3 py-2 text-sm font-semibold text-white hover:bg-green-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-600"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                'Update Password'
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

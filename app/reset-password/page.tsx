"use client";

import { Suspense, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import Header from "@/components/header";
import { Loader2 } from "lucide-react";

// Wrapper component to handle the loading state
function ResetPasswordForm() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-green-600" />
      </div>
    }>
      <ResetPasswordPageContent />
    </Suspense>
  );
}

// Main component with the form logic
function ResetPasswordPageContent() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const router = useRouter();

  // Get the access token from the URL hash fragment
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const hash = window.location.hash.substring(1);
      const params = new URLSearchParams(hash);
      const token = params.get('access_token');
      setAccessToken(token);
      
      // Clean up the URL
      if (token) {
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessToken) {
      toast.error("Invalid or missing reset token.");
      return;
    }
    if (password !== confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accessToken, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Failed to reset password.");
      } else {
        toast.success("Password reset successfully! Please login.");
        setPassword("");
        setConfirmPassword("");
        setTimeout(() => router.push("/login"), 2000);
      }
    } catch (err) {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Header title="Reset Password" />
      <div className="bg-white rounded-lg p-6 shadow-sm border max-w-md mx-auto mt-10">
        <h2 className="text-xl font-bold mb-4">Set a New Password</h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <Label htmlFor="password">New Password</Label>
            <Input
              id="password"
              name="password"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Enter new password"
              required
              className="mt-1"
            />
          </div>
          <div className="mb-4">
            <Label htmlFor="confirmPassword">Confirm New Password</Label>
            <Input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              placeholder="Confirm new password"
              required
              className="mt-1"
            />
          </div>
          <Button type="submit" className="w-full bg-green-600 hover:bg-green-700" disabled={loading}>
            {loading ? "Resetting..." : "Reset Password"}
          </Button>
        </form>
      </div>
    </>
  );
}

export default ResetPasswordForm;

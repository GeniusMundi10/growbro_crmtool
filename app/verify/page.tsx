"use client";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function VerifyPage() {
  const router = useRouter();
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-400 via-green-600 to-green-900">
      <Card className="w-full max-w-md shadow-xl rounded-2xl border-0 bg-white/90">
        <CardContent className="p-8 text-center">
          <img src="/logo.svg" alt="Growbro AI" className="mx-auto mb-2 h-10" />
          <h1 className="text-2xl font-bold text-green-700 mb-2">Verify Your Email</h1>
          <p className="text-green-600 mb-6">We've sent a verification link to your email address.<br/>Please check your inbox and follow the instructions to activate your account.</p>
          <Button className="bg-green-700 hover:bg-green-800 text-white font-semibold w-full" onClick={() => router.push('/login')}>Back to Login</Button>
        </CardContent>
      </Card>
    </div>
  );
}

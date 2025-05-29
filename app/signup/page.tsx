"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function SignupPage() {
  const router = useRouter();
  const supabase = createClientComponentClient();
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    company: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    website: "",
    terms: false,
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  function handleChange(e: any) {
    const { name, value, type, checked } = e.target;
    setForm(f => ({ ...f, [name]: type === "checkbox" ? checked : value }));
  }

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess(false);
    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (!form.terms) {
      setError("You must agree to the Terms and Conditions.");
      return;
    }
    setLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: {
        data: {
          first_name: form.firstName,
          last_name: form.lastName,
          company: form.company,
          phone: form.phone,
          website: form.website,
        }
      }
    });
    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }
    const user = data?.user;
    if (user && user.id) {
      // Insert into public.users
      const { error: insertError } = await supabase.from("users").insert([
        {
          id: user.id,
          name: `${form.firstName} ${form.lastName}`.trim(),
          email: form.email,
          avatar_url: user.user_metadata?.avatar_url || null,
          plan: 'free',
          billing_info: null,
          email_verified: false,
          company: form.company,
          phone: form.phone,
          website: form.website,
        }
      ]);
      if (insertError) {
        setLoading(false);
        setError(insertError.message);
        return;
      }

      // Insert into business_info (AI) with mapped fields and defaults
      const aiName = `${form.firstName} ${form.lastName}`.trim() || form.email.split('@')[0] + "'s AI";
      const { error: businessInfoError } = await supabase.from("business_info").insert([
        {
          user_id: user.id,
          ai_name: aiName,
          company_name: form.company,
          website: form.website,
          email: form.email,
          calendar_link: null,
          phone_number: form.phone,
          agent_type: "information-education",
          branding: null,
          heading_title_color: "#FFFFFF",
          heading_background_color: "#4285F4",
          ai_message_color: "#000000",
          ai_message_background_color: "#F1F1F1",
          user_message_color: "#FFFFFF",
          user_message_background_color: "#4285F4",
          widget_color: "#4285F4",
          send_button_color: "#4285F4",
          start_minimized: false,
        }
      ]);
      setLoading(false);
      if (businessInfoError) {
        setError(businessInfoError.message);
        return;
      }
      router.push("/verify");
    } else {
      setLoading(false);
      setError("Signup failed. Please try again.");
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-400 via-green-600 to-green-900">
      <Card className="w-full max-w-lg shadow-2xl rounded-2xl border-0 bg-white/90">
        <CardContent className="p-8">
          <div className="mb-8 text-center">
            <img src="/logo.svg" alt="Growbro AI" className="mx-auto mb-2 h-10" />
            <h1 className="text-2xl font-bold text-green-700">Try Growbro for FREE and Boost Your Sales! 🚀</h1>
            <p className="text-green-500">Sign up to supercharge your business with AI</p>
          </div>
          <form onSubmit={handleSignup} className="space-y-4">
            <div className="flex gap-3">
              <div className="w-1/2">
                <Label htmlFor="firstName">First Name</Label>
                <Input id="firstName" name="firstName" required value={form.firstName} onChange={handleChange} className="mt-1" />
              </div>
              <div className="w-1/2">
                <Label htmlFor="lastName">Last Name</Label>
                <Input id="lastName" name="lastName" required value={form.lastName} onChange={handleChange} className="mt-1" />
              </div>
            </div>
            <div>
              <Label htmlFor="company">Company Name</Label>
              <Input id="company" name="company" required value={form.company} onChange={handleChange} className="mt-1" />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" autoComplete="email" required value={form.email} onChange={handleChange} className="mt-1" />
            </div>
            <div>
              <Label htmlFor="phone">Phone Number</Label>
              <Input id="phone" name="phone" type="tel" required value={form.phone} onChange={handleChange} className="mt-1" />
            </div>
            <div className="flex gap-3">
              <div className="w-1/2">
                <Label htmlFor="password">Password</Label>
                <Input id="password" name="password" type="password" autoComplete="new-password" required value={form.password} onChange={handleChange} className="mt-1" />
              </div>
              <div className="w-1/2">
                <Label htmlFor="confirmPassword">Re-Type Password</Label>
                <Input id="confirmPassword" name="confirmPassword" type="password" autoComplete="new-password" required value={form.confirmPassword} onChange={handleChange} className="mt-1" />
              </div>
            </div>
            <div>
              <Label htmlFor="website">Website URL to train AI</Label>
              <Input id="website" name="website" type="url" required value={form.website} onChange={handleChange} className="mt-1" />
            </div>
            <div className="flex items-center gap-2 mt-2">
              <Checkbox id="terms" name="terms" checked={form.terms} onCheckedChange={val => setForm(f => ({ ...f, terms: !!val }))} />
              <Label htmlFor="terms" className="text-sm">I agree to the <a href="#" className="underline text-green-700">Terms and Conditions</a></Label>
            </div>
            {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}

            <Button type="submit" className="w-full bg-green-700 hover:bg-green-800 text-white font-semibold mt-2" disabled={loading}>{loading ? "Signing up..." : "Sign Up"}</Button>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col items-center gap-2 pb-6">
          <span className="text-sm text-gray-600">Already have an account? <a href="/login" className="text-green-700 font-semibold hover:underline">Log in</a></span>
        </CardFooter>
      </Card>
    </div>
  );
}

"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import AnimatedLogoSprout from "@/components/AnimatedLogoSprout";
// Next 13+ uses the app router which doesn't support next/head directly

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
      // Persist signup form values for use after login
      if (typeof window !== 'undefined') {
        localStorage.setItem('pendingBusinessInfo', JSON.stringify(form));
      }
      // Do not insert into public.users or business_info here. This avoids RLS issues. Only redirect to /verify.
      router.push("/verify");
    } else {
      setLoading(false);
      setError("Signup failed. Please try again.");
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
        }
      `}</style>
      <Card className="w-full max-w-lg shadow-2xl rounded-2xl border-0 bg-white/90">
        <CardContent className="p-8">
          <div className="mb-8 text-center">
            <div className="flex flex-col items-center mb-2">
  <AnimatedLogoSprout size={56} />
  <div className="font-bold text-xl text-green-800 tracking-tight mt-2">growbro.ai</div>
</div>
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

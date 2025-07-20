"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import Header from "@/components/header";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/auth/request-password-reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Failed to send password reset email.");
      } else {
        toast.success("Password reset email sent! Please check your inbox.");
        setEmail("");
      }
    } catch (err) {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-400 via-green-600 to-green-900">
      {/* Mobile-specific styling to match desktop experience */}
      <style jsx global>{`
        /* Mobile-specific overrides to match desktop experience */
        @media (max-width: 767px) {
          /* Force all text to have good contrast in mobile */
          h1, h2, h3, h4, h5, h6, p, span, div, label, input, button, a {
            color: #111827 !important; /* text-gray-900 */
          }

          /* Make headings explicitly visible with strong contrast */
          h2, .text-xl {
            color: #000000 !important;
            opacity: 1 !important;
            font-weight: 700 !important;
            text-shadow: 0 0 1px rgba(255,255,255,0.5);
          }
          
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
            font-weight: 600 !important;
          }
          
          /* Ensure form labels are visible against the background */
          form label {
            color: #111827 !important; /* text-gray-900 */
            font-weight: 600 !important;
            display: block !important;
            margin-bottom: 4px !important;
          }
          
          /* Fix card transparency issues on mobile */
          .card, .bg-white, .bg-white\/90, .bg-white.rounded-lg {
            background-color: #ffffff !important;
            backdrop-filter: none !important;
            border: 1px solid #d1d5db !important;
          }
          
          /* Force white background on container */
          .bg-white.rounded-lg {
            background-color: #ffffff !important;
            color: #000000 !important;
          }
          
          /* Fix form element styles */
          .form-input, input[type="email"] {
            background-color: #ffffff !important;
            color: #111827 !important;
            border: 1px solid #d1d5db !important;
          }

          /* Make button text visible */
          button, .bg-green-600, .bg-green-700 {
            color: #ffffff !important;
            font-weight: 600 !important;
          }
        }
      `}</style>
      <Header title="Forgot Password" />
      <div className="bg-white rounded-lg p-6 shadow-sm border max-w-md mx-auto mt-10">
        <h2 className="text-xl font-bold mb-4">Reset your password</h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="Enter your email"
              required
              className="mt-1"
            />
          </div>
          <Button type="submit" className="w-full bg-green-600 hover:bg-green-700" disabled={loading}>
            {loading ? "Sending..." : "Send Reset Email"}
          </Button>
        </form>
      </div>
    </div>
  );
}

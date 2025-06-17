"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

import Header from "@/components/header";

export default function AccountPasswordSettings() {

  const [form, setForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [saving, setSaving] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("[DEBUG] handleSubmit called", form);
    if (form.newPassword !== form.confirmPassword) {
      console.log("[DEBUG] Passwords do not match");
      toast.error("New passwords do not match.");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch('/api/account/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword: form.currentPassword,
          newPassword: form.newPassword,
        }),
      });
      console.log("[DEBUG] API response status:", res.status);
      const data = await res.json();
      console.log("[DEBUG] API response data:", data);
      if (!res.ok) {
        console.log("[DEBUG] Showing error toast", data.error);
        toast.error(data.error || 'Failed to change password.');
      } else {
        console.log("[DEBUG] Showing success toast", data.message);
        toast.success(data.message || "Password changed successfully.");
        setForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      }
    } catch (err) {
      console.log("[DEBUG] Exception caught", err);
      toast.error('Something went wrong. Please try again.');
    } finally {
      setSaving(false);
    }
  };


  return (
    <>
      <Header title="Account Settings" />
      <div className="bg-white rounded-lg p-6 shadow-sm border max-w-md mx-auto mt-10">
      <h2 className="text-xl font-bold mb-4">Change Password</h2>
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <Label htmlFor="currentPassword">Current Password</Label>
          <Input
            id="currentPassword"
            name="currentPassword"
            type="password"
            value={form.currentPassword}
            onChange={handleChange}
            autoComplete="current-password"
            className="mt-1"
          />
        </div>
        <div className="mb-4">
          <Label htmlFor="newPassword">New Password</Label>
          <Input
            id="newPassword"
            name="newPassword"
            type="password"
            value={form.newPassword}
            onChange={handleChange}
            autoComplete="new-password"
            className="mt-1"
          />
        </div>
        <div className="mb-4">
          <Label htmlFor="confirmPassword">Confirm New Password</Label>
          <Input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            value={form.confirmPassword}
            onChange={handleChange}
            autoComplete="new-password"
            className="mt-1"
          />
        </div>
        <Button type="submit" className="bg-green-600 hover:bg-green-700 w-full" disabled={saving}>
          {saving ? "Saving..." : "Change Password"}
        </Button>
      </form>
      </div>
    </>
  );
}

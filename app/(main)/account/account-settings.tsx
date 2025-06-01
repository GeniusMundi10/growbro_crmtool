"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useUser } from "@/context/UserContext"
import { useToast } from "@/components/ui/use-toast"

export default function AccountSettings() {
  const { user, loading, refreshUser } = useUser();
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    name: '',
    company: '',
    website: '',
    email: '',
    phone: '',
    plan: '',
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        company: user.company || '',
        website: user.website || '',
        email: user.email || '',
        phone: user.phone || '',
        plan: user.plan || '',
      });
    }
  }, [user]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch('/api/account', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          company: formData.company,
          website: formData.website,
          email: formData.email,
          phone: formData.phone,
        }),
      });
      if (!res.ok) throw new Error('Failed to update account');
      await refreshUser();
      toast({
        title: "Success",
        description: "Your account information has been updated.",
        variant: "default",
      });
    } catch (err) {
      console.error('Error updating account:', err);
      toast({
        title: "Error",
        description: "Failed to update your account information. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="bg-white rounded-lg p-6 shadow-sm border">
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <Label htmlFor="name">Full Name</Label>
            <Input
              id="name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="company">Company Name</Label>
            <Input
              id="company"
              name="company"
              value={formData.company}
              onChange={handleInputChange}
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="website">Website</Label>
            <Input
              id="website"
              name="website"
              value={formData.website}
              onChange={handleInputChange}
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleInputChange}
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="phone">Phone Number</Label>
            <Input
              id="phone"
              name="phone"
              value={formData.phone}
              onChange={handleInputChange}
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="plan">Plan</Label>
            <Input
              id="plan"
              name="plan"
              value={formData.plan}
              disabled
              className="mt-1 bg-gray-100 cursor-not-allowed"
            />
          </div>
        </div>

        <div className="flex justify-center mt-8">
          <Button type="submit" className="bg-green-600 hover:bg-green-700">
            Save Changes
          </Button>
        </div>
      </form>
    </div>
  )
}

"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useUser } from "@/context/UserContext"
import { useToast } from "@/components/ui/use-toast"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Shimmer } from "@/components/ui/shimmer"

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

  if (loading) {
    return (
      <div className="space-y-6">
        <Card className="shadow-sm">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-4">
              <Shimmer className="h-14 w-14 rounded-full" />
              <div className="flex-1">
                <Shimmer className="h-5 w-48 mb-2" />
                <Shimmer className="h-4 w-32" />
              </div>
              <Shimmer className="h-6 w-24 rounded-full" />
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="space-y-2">
                  <Shimmer className="h-4 w-28" />
                  <Shimmer className="h-10 w-full" />
                </div>
              ))}
            </div>
          </CardContent>
          <CardFooter className="justify-center">
            <Shimmer className="h-10 w-40 rounded-md" />
          </CardFooter>
        </Card>
      </div>
    )
  }

  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-4">
          <Avatar className="h-14 w-14 shadow ring-2 ring-blue-100">
            <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold">
              {(formData.name || formData.email || 'U').trim().charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <CardTitle className="text-lg leading-tight">{formData.name || "Your Name"}</CardTitle>
            <div className="text-sm text-muted-foreground truncate">{formData.email || "you@example.com"}</div>
          </div>
          {formData.plan && (
            <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100">{formData.plan}</Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="Enter your full name"
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
                placeholder="Your company"
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
                placeholder="https://"
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
                placeholder="you@example.com"
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
                placeholder="+1 555 000 0000"
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
          <div className="flex justify-center">
            <Button type="submit" disabled={saving} className="bg-emerald-600 hover:bg-emerald-700">
              {saving ? (
                <span className="inline-flex items-center"><span className="mr-2 h-4 w-4 border-2 border-white/40 border-t-white rounded-full animate-spin"></span>Saving...</span>
              ) : (
                "Save Changes"
              )}
            </Button>
          </div>
        </form>
      </CardContent>
      <CardFooter />
    </Card>
  )
}

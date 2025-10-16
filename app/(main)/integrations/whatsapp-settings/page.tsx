"use client";

import { useState, useEffect } from "react";
import { useUser } from "@/context/UserContext";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Save, Upload, CheckCircle2, AlertCircle, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const BUSINESS_CATEGORIES = [
  { value: "RETAIL", label: "Shopping and Retail" },
  { value: "RESTAURANT", label: "Restaurant" },
  { value: "HEALTH", label: "Medical and Health" },
  { value: "BEAUTY", label: "Beauty, Spa and Salon" },
  { value: "PROF_SERVICES", label: "Professional Services" },
  { value: "EDU", label: "Education" },
  { value: "FINANCE", label: "Finance and Banking" },
  { value: "HOTEL", label: "Hotel and Lodging" },
  { value: "TRAVEL", label: "Travel and Transportation" },
  { value: "AUTO", label: "Automotive" },
  { value: "ENTERTAIN", label: "Entertainment" },
  { value: "EVENT_PLAN", label: "Event Planning and Service" },
  { value: "GOVT", label: "Public Service" },
  { value: "GROCERY", label: "Food and Grocery" },
  { value: "NONPROFIT", label: "Non-profit" },
  { value: "OTHER", label: "Other" },
];

export default function WhatsAppSettingsPage() {
  const { user } = useUser();
  const router = useRouter();
  const searchParams = useSearchParams();
  const ai_id = searchParams.get("ai_id");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Profile fields
  const [about, setAbout] = useState("");
  const [address, setAddress] = useState("");
  const [description, setDescription] = useState("");
  const [email, setEmail] = useState("");
  const [vertical, setVertical] = useState("");
  const [website1, setWebsite1] = useState("");
  const [website2, setWebsite2] = useState("");

  // Display name
  const [currentDisplayName, setCurrentDisplayName] = useState("");
  const [displayNameStatus, setDisplayNameStatus] = useState("");
  const [newDisplayName, setNewDisplayName] = useState("");
  const [newDisplayNameStatus, setNewDisplayNameStatus] = useState("");
  const [displayNameInput, setDisplayNameInput] = useState("");
  const [requestingName, setRequestingName] = useState(false);

  // Profile photo
  const [currentProfilePicture, setCurrentProfilePicture] = useState<string | null>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!ai_id) {
      toast.error("No AI selected");
      router.push("/integrations");
      return;
    }
    loadProfile();
    loadDisplayNameStatus();
  }, [ai_id]);

  const loadProfile = async () => {
    setLoading(true);
    try {
      const resp = await fetch("/api/whatsapp/profile/get", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ai_id }),
      });
      const data = await resp.json();
      
      console.log("[WhatsApp Settings] Full profile response:", JSON.stringify(data, null, 2));
      
      if (!resp.ok) {
        toast.error("Failed to load profile: " + (data.error || "Unknown error"));
        setLoading(false);
        return;
      }
      
      // Handle different response structures
      let profile = null;
      if (data.data && Array.isArray(data.data) && data.data.length > 0) {
        profile = data.data[0];
      } else if (data.data && !Array.isArray(data.data)) {
        profile = data.data;
      }
      
      if (profile) {
        console.log("[WhatsApp Settings] Parsed profile:", profile);
        setAbout(profile.about || "");
        setAddress(profile.address || "");
        setDescription(profile.description || "");
        setEmail(profile.email || "");
        setVertical(profile.vertical || "");
        setCurrentProfilePicture(profile.profile_picture_url || null);
        const websites = profile.websites || [];
        console.log("[WhatsApp Settings] Websites:", websites);
        setWebsite1(websites[0] || "");
        setWebsite2(websites[1] || "");
        toast.success("Profile loaded successfully");
      } else {
        // Profile exists but is empty - this is normal for new accounts
        console.log("[WhatsApp Settings] No profile data in response");
        toast.info("No profile data found. You can set it up below.");
      }
    } catch (e: any) {
      console.error("[WhatsApp Settings] Load error:", e);
      toast.error("Failed to load profile: " + (e?.message || "Unknown error"));
    } finally {
      setLoading(false);
    }
  };

  const loadDisplayNameStatus = async () => {
    try {
      const resp = await fetch(`/api/whatsapp/display-name/status?ai_id=${encodeURIComponent(ai_id!)}`);
      const data = await resp.json();
      console.log("[WhatsApp Settings] Display name response:", data);
      if (resp.ok) {
        setCurrentDisplayName(data.verified_name || "");
        setDisplayNameStatus(data.name_status || "");
        setNewDisplayName(data.new_display_name || "");
        setNewDisplayNameStatus(data.new_name_status || "");
      }
    } catch (e) {
      console.error("Failed to load display name status:", e);
    }
  };

  const handleSaveProfile = async () => {
    if (!ai_id) return;
    
    // Validate
    if (about && (about.length < 1 || about.length > 139)) {
      toast.error("About must be 1-139 characters");
      return;
    }
    if (address && address.length > 256) {
      toast.error("Address max length is 256 characters");
      return;
    }
    if (description && description.length > 512) {
      toast.error("Description max length is 512 characters");
      return;
    }
    if (email && email.length > 128) {
      toast.error("Email max length is 128 characters");
      return;
    }
    
    const websites = [];
    if (website1) {
      if (!website1.startsWith("http://") && !website1.startsWith("https://")) {
        toast.error("Website 1 must start with http:// or https://");
        return;
      }
      websites.push(website1);
    }
    if (website2) {
      if (!website2.startsWith("http://") && !website2.startsWith("https://")) {
        toast.error("Website 2 must start with http:// or https://");
        return;
      }
      websites.push(website2);
    }

    setSaving(true);
    try {
      const payload: any = { ai_id };
      if (about) payload.about = about;
      if (address) payload.address = address;
      if (description) payload.description = description;
      if (email) payload.email = email;
      if (vertical) payload.vertical = vertical;
      if (websites.length > 0) payload.websites = websites;

      const resp = await fetch("/api/whatsapp/profile/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await resp.json();
      if (resp.ok && data.success) {
        toast.success("Profile updated successfully");
        loadProfile();
      } else {
        toast.error("Failed to update profile: " + (data.error?.message || data.error || "Unknown error"));
      }
    } catch (e: any) {
      toast.error("Error: " + (e?.message || "Unknown error"));
    } finally {
      setSaving(false);
    }
  };

  const handleRequestDisplayName = async () => {
    if (!ai_id || !displayNameInput.trim()) {
      toast.error("Please enter a display name");
      return;
    }
    setRequestingName(true);
    try {
      const resp = await fetch("/api/whatsapp/display-name/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ai_id, display_name: displayNameInput.trim() }),
      });
      const data = await resp.json();
      if (resp.ok && data.success) {
        toast.success("Display name updated successfully. It will undergo verification.");
        setDisplayNameInput("");
        loadDisplayNameStatus();
      } else {
        toast.error("Failed to update display name: " + (data.error?.message || data.error || "Unknown error"));
      }
    } catch (e: any) {
      toast.error("Error: " + (e?.message || "Unknown error"));
    } finally {
      setRequestingName(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error("Please select an image file");
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be less than 5MB");
      return;
    }

    setSelectedFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleUploadPhoto = async () => {
    if (!ai_id || !selectedFile) {
      toast.error("Please select a photo first");
      return;
    }

    setUploadingPhoto(true);
    try {
      const formData = new FormData();
      formData.append('ai_id', ai_id);
      formData.append('file', selectedFile);

      const resp = await fetch("/api/whatsapp/profile/photo/upload", {
        method: "POST",
        body: formData,
      });
      const data = await resp.json();
      if (resp.ok && data.success) {
        toast.success("Profile photo updated successfully!");
        setSelectedFile(null);
        setPreviewUrl(null);
        loadProfile();
      } else {
        toast.error("Failed to upload photo: " + (data.error?.message || data.error || "Unknown error"));
      }
    } catch (e: any) {
      toast.error("Error: " + (e?.message || "Unknown error"));
    } finally {
      setUploadingPhoto(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 sm:px-6 py-4 sm:py-6">
        <div className="flex items-center gap-2 mb-6">
          <Button variant="ghost" size="sm" onClick={() => router.push("/integrations")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </div>
        <div className="text-center py-12">Loading WhatsApp settings...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 sm:px-6 py-4 sm:py-6 max-w-4xl">
      <div className="flex items-center gap-2 mb-6">
        <Button variant="ghost" size="sm" onClick={() => router.push("/integrations")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Integrations
        </Button>
      </div>

      <h1 className="text-3xl font-bold mb-2">WhatsApp Business Settings</h1>
      <p className="text-muted-foreground mb-6">
        Manage your WhatsApp Business profile, display name, and other settings.
      </p>

      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="profile">Business Profile</TabsTrigger>
          <TabsTrigger value="display-name">Display Name</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Business Profile</CardTitle>
              <CardDescription>
                Update your WhatsApp Business profile information. This appears in your business profile on WhatsApp.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="about">About <span className="text-xs text-muted-foreground">(1-139 characters)</span></Label>
                <Input
                  id="about"
                  value={about}
                  onChange={(e) => setAbout(e.target.value)}
                  placeholder="Brief description of your business"
                  maxLength={139}
                />
                <p className="text-xs text-muted-foreground mt-1">{about.length}/139</p>
              </div>

              <div>
                <Label htmlFor="description">Description <span className="text-xs text-muted-foreground">(max 512 characters)</span></Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Detailed description of your business"
                  maxLength={512}
                  rows={4}
                />
                <p className="text-xs text-muted-foreground mt-1">{description.length}/512</p>
              </div>

              <div>
                <Label htmlFor="address">Address <span className="text-xs text-muted-foreground">(max 256 characters)</span></Label>
                <Input
                  id="address"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Business address"
                  maxLength={256}
                />
              </div>

              <div>
                <Label htmlFor="email">Contact Email <span className="text-xs text-muted-foreground">(max 128 characters)</span></Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="contact@yourbusiness.com"
                  maxLength={128}
                />
              </div>

              <div>
                <Label htmlFor="vertical">Business Category</Label>
                <Select value={vertical} onValueChange={setVertical}>
                  <SelectTrigger id="vertical">
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    {BUSINESS_CATEGORIES.map((cat) => (
                      <SelectItem key={cat.value} value={cat.value}>
                        {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="website1">Website 1 <span className="text-xs text-muted-foreground">(must start with http:// or https://)</span></Label>
                <Input
                  id="website1"
                  value={website1}
                  onChange={(e) => setWebsite1(e.target.value)}
                  placeholder="https://yourbusiness.com"
                />
              </div>

              <div>
                <Label htmlFor="website2">Website 2 <span className="text-xs text-muted-foreground">(optional)</span></Label>
                <Input
                  id="website2"
                  value={website2}
                  onChange={(e) => setWebsite2(e.target.value)}
                  placeholder="https://instagram.com/yourbusiness"
                />
              </div>

              <Button onClick={handleSaveProfile} disabled={saving} className="w-full">
                {saving ? (
                  <>Saving...</>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save Profile
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="display-name" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Display Name</CardTitle>
              <CardDescription>
                Update your WhatsApp Business display name. Changes will undergo Meta verification.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {currentDisplayName && (
                <div className="rounded-lg bg-gradient-to-br from-slate-50 to-gray-50 border border-gray-200/60 p-4 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Current Display Name</span>
                    <Badge variant={displayNameStatus === "APPROVED" ? "default" : "secondary"} className={displayNameStatus === "APPROVED" ? "bg-emerald-500" : ""}>
                      {displayNameStatus === "APPROVED" && <CheckCircle2 className="h-3 w-3 mr-1" />}
                      {displayNameStatus || "Unknown"}
                    </Badge>
                  </div>
                  <p className="text-lg font-semibold text-gray-900">{currentDisplayName}</p>
                </div>
              )}

              {newDisplayName && newDisplayNameStatus && (
                <div className="rounded-lg bg-blue-50/50 border border-blue-200/50 p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-blue-700 uppercase tracking-wide">Pending Update</span>
                    <Badge variant="secondary">
                      <Clock className="h-3 w-3 mr-1" />
                      {newDisplayNameStatus}
                    </Badge>
                  </div>
                  <p className="text-sm font-medium text-blue-900">{newDisplayName}</p>
                  <p className="text-xs text-blue-700">This name is under review by Meta.</p>
                </div>
              )}

              <div>
                <Label htmlFor="displayNameInput">New Display Name</Label>
                <Input
                  id="displayNameInput"
                  value={displayNameInput}
                  onChange={(e) => setDisplayNameInput(e.target.value)}
                  placeholder={currentDisplayName || "Your Business Name"}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Choose a name that represents your business. Meta reviews all display name changes.
                </p>
              </div>

              <Button onClick={handleRequestDisplayName} disabled={requestingName || !displayNameInput.trim()} className="w-full">
                {requestingName ? "Updating..." : "Update Display Name"}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Profile Photo</CardTitle>
              <CardDescription>
                Upload a profile photo for your WhatsApp Business account.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {currentProfilePicture && (
                <div className="rounded-lg bg-gradient-to-br from-slate-50 to-gray-50 border border-gray-200/60 p-4">
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">Current Profile Picture</p>
                  <div className="flex items-center gap-4">
                    <div className="relative w-20 h-20 rounded-full overflow-hidden border-2 border-gray-300 shadow-sm">
                      <img src={currentProfilePicture} alt="Current profile" className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-gray-600">This is your current WhatsApp Business profile photo</p>
                    </div>
                  </div>
                </div>
              )}

              <div>
                <Label htmlFor="photoUpload">Select New Image</Label>
                <Input
                  id="photoUpload"
                  type="file"
                  accept="image/jpeg,image/jpg,image/png"
                  onChange={handleFileSelect}
                  disabled={uploadingPhoto}
                  className="cursor-pointer"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  JPEG or PNG, max 5MB. Square images work best.
                </p>
              </div>

              {previewUrl && (
                <div className="rounded-lg bg-blue-50/50 border border-blue-200/50 p-4">
                  <p className="text-xs font-medium text-blue-700 uppercase tracking-wide mb-3">Preview</p>
                  <div className="flex items-center gap-4">
                    <div className="relative w-20 h-20 rounded-full overflow-hidden border-2 border-blue-300 shadow-sm">
                      <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-blue-900">{selectedFile?.name}</p>
                      <p className="text-xs text-blue-700">
                        {selectedFile && `${(selectedFile.size / 1024).toFixed(1)} KB`}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <Button 
                onClick={handleUploadPhoto} 
                disabled={!selectedFile || uploadingPhoto} 
                className="w-full"
              >
                {uploadingPhoto ? (
                  <>Uploading...</>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    Upload Profile Photo
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

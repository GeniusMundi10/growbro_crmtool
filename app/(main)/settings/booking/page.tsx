"use client"

import { useState, useEffect } from "react";
import { useUser } from "@/context/UserContext";
import Header from "@/components/header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Clock, MapPin, Settings, Calendar, Truck, Save, Plus, X } from "lucide-react";

interface BusinessHours {
  [key: string]: {
    open: string;
    close: string;
    enabled: boolean;
  };
}

interface BookingSettings {
  enabled: boolean;
  slot_duration_minutes: number;
  max_advance_days: number;
  require_phone: boolean;
  require_email: boolean;
  auto_confirm: boolean;
  delivery: {
    enabled: boolean;
    max_deliveries_per_day: number;
    service_areas: string[];
    delivery_fee: number;
    free_delivery_above: number;
  };
  pickup: {
    enabled: boolean;
    max_slots_per_hour: number;
  };
}

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

export default function BookingSettingsPage() {
  const { user } = useUser();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [aiId, setAiId] = useState<string | null>(null);
  const [businessHours, setBusinessHours] = useState<BusinessHours>({});
  const [bookingSettings, setBookingSettings] = useState<BookingSettings>({
    enabled: false,
    slot_duration_minutes: 30,
    max_advance_days: 30,
    require_phone: true,
    require_email: false,
    auto_confirm: false,
    delivery: {
      enabled: true,
      max_deliveries_per_day: 50,
      service_areas: [],
      delivery_fee: 50,
      free_delivery_above: 500,
    },
    pickup: {
      enabled: true,
      max_slots_per_hour: 4,
    },
  });
  const [newServiceArea, setNewServiceArea] = useState("");

  useEffect(() => {
    if (user?.id) {
      fetchSettings();
    }
  }, [user?.id]);

  const fetchSettings = async () => {
    try {
      const { supabase } = await import("@/lib/supabase");
      
      // Get user's AI
      const { data: aiData } = await supabase
        .from("business_info")
        .select("id, business_hours, booking_settings")
        .eq("user_id", user?.id)
        .single();

      if (aiData) {
        setAiId(aiData.id);
        setBusinessHours(aiData.business_hours || getDefaultBusinessHours());
        setBookingSettings(aiData.booking_settings || bookingSettings);
      }
    } catch (error) {
      console.error("Error fetching settings:", error);
    } finally {
      setLoading(false);
    }
  };

  const getDefaultBusinessHours = (): BusinessHours => {
    const hours: BusinessHours = {};
    DAYS.forEach(day => {
      hours[day] = {
        open: "09:00",
        close: "18:00",
        enabled: day !== 'sunday'
      };
    });
    return hours;
  };

  const saveSettings = async () => {
    if (!aiId) return;
    
    setSaving(true);
    try {
      const { supabase } = await import("@/lib/supabase");
      
      const { error } = await supabase
        .from("business_info")
        .update({
          business_hours: businessHours,
          booking_settings: bookingSettings,
        })
        .eq("id", aiId);

      if (error) throw error;
      
      alert("Settings saved successfully!");
    } catch (error) {
      console.error("Error saving settings:", error);
      alert("Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  const updateBusinessHours = (day: string, field: 'open' | 'close' | 'enabled', value: string | boolean) => {
    setBusinessHours(prev => ({
      ...prev,
      [day]: {
        ...prev[day],
        [field]: value
      }
    }));
  };

  const addServiceArea = () => {
    if (newServiceArea.trim()) {
      setBookingSettings(prev => ({
        ...prev,
        delivery: {
          ...prev.delivery,
          service_areas: [...prev.delivery.service_areas, newServiceArea.trim()]
        }
      }));
      setNewServiceArea("");
    }
  };

  const removeServiceArea = (area: string) => {
    setBookingSettings(prev => ({
      ...prev,
      delivery: {
        ...prev.delivery,
        service_areas: prev.delivery.service_areas.filter(a => a !== area)
      }
    }));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
        <Header />
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Booking Settings</h1>
          <p className="text-gray-600">Configure appointment booking and delivery options for your pharmacy</p>
        </div>

        <Tabs defaultValue="general" className="space-y-6">
          <TabsList className="bg-white">
            <TabsTrigger value="general" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              General
            </TabsTrigger>
            <TabsTrigger value="hours" className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Business Hours
            </TabsTrigger>
            <TabsTrigger value="delivery" className="flex items-center gap-2">
              <Truck className="h-4 w-4" />
              Delivery
            </TabsTrigger>
            <TabsTrigger value="pickup" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Pickup
            </TabsTrigger>
          </TabsList>

          {/* General Settings */}
          <TabsContent value="general">
            <Card>
              <CardHeader>
                <CardTitle>General Booking Settings</CardTitle>
                <CardDescription>Enable and configure booking functionality</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-base font-semibold">Enable Booking System</Label>
                    <p className="text-sm text-gray-500">Allow customers to book appointments and order medicines</p>
                  </div>
                  <Switch
                    checked={bookingSettings.enabled}
                    onCheckedChange={(checked) => setBookingSettings(prev => ({ ...prev, enabled: checked }))}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label>Slot Duration (minutes)</Label>
                    <Input
                      type="number"
                      value={bookingSettings.slot_duration_minutes}
                      onChange={(e) => setBookingSettings(prev => ({ ...prev, slot_duration_minutes: parseInt(e.target.value) }))}
                      min="15"
                      step="15"
                    />
                    <p className="text-xs text-gray-500 mt-1">Time interval for pickup slots</p>
                  </div>

                  <div>
                    <Label>Max Advance Days</Label>
                    <Input
                      type="number"
                      value={bookingSettings.max_advance_days}
                      onChange={(e) => setBookingSettings(prev => ({ ...prev, max_advance_days: parseInt(e.target.value) }))}
                      min="1"
                    />
                    <p className="text-xs text-gray-500 mt-1">How far ahead customers can book</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label>Require Phone Number</Label>
                    <Switch
                      checked={bookingSettings.require_phone}
                      onCheckedChange={(checked) => setBookingSettings(prev => ({ ...prev, require_phone: checked }))}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label>Require Email</Label>
                    <Switch
                      checked={bookingSettings.require_email}
                      onCheckedChange={(checked) => setBookingSettings(prev => ({ ...prev, require_email: checked }))}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label>Auto-Confirm Bookings</Label>
                    <Switch
                      checked={bookingSettings.auto_confirm}
                      onCheckedChange={(checked) => setBookingSettings(prev => ({ ...prev, auto_confirm: checked }))}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Business Hours */}
          <TabsContent value="hours">
            <Card>
              <CardHeader>
                <CardTitle>Business Hours</CardTitle>
                <CardDescription>Set your operating hours for each day</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {DAYS.map(day => (
                    <div key={day} className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                      <div className="w-32">
                        <Label className="capitalize font-semibold">{day}</Label>
                      </div>
                      
                      <Switch
                        checked={businessHours[day]?.enabled || false}
                        onCheckedChange={(checked) => updateBusinessHours(day, 'enabled', checked)}
                      />

                      {businessHours[day]?.enabled && (
                        <>
                          <div className="flex items-center gap-2">
                            <Label className="text-sm">Open:</Label>
                            <Input
                              type="time"
                              value={businessHours[day]?.open || "09:00"}
                              onChange={(e) => updateBusinessHours(day, 'open', e.target.value)}
                              className="w-32"
                            />
                          </div>

                          <div className="flex items-center gap-2">
                            <Label className="text-sm">Close:</Label>
                            <Input
                              type="time"
                              value={businessHours[day]?.close || "18:00"}
                              onChange={(e) => updateBusinessHours(day, 'close', e.target.value)}
                              className="w-32"
                            />
                          </div>
                        </>
                      )}

                      {!businessHours[day]?.enabled && (
                        <Badge variant="secondary">Closed</Badge>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Delivery Settings */}
          <TabsContent value="delivery">
            <Card>
              <CardHeader>
                <CardTitle>Delivery Settings</CardTitle>
                <CardDescription>Configure medicine delivery options</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-base font-semibold">Enable Delivery</Label>
                    <p className="text-sm text-gray-500">Allow customers to order for delivery</p>
                  </div>
                  <Switch
                    checked={bookingSettings.delivery.enabled}
                    onCheckedChange={(checked) => setBookingSettings(prev => ({
                      ...prev,
                      delivery: { ...prev.delivery, enabled: checked }
                    }))}
                  />
                </div>

                {bookingSettings.delivery.enabled && (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <Label>Max Deliveries Per Day</Label>
                        <Input
                          type="number"
                          value={bookingSettings.delivery.max_deliveries_per_day}
                          onChange={(e) => setBookingSettings(prev => ({
                            ...prev,
                            delivery: { ...prev.delivery, max_deliveries_per_day: parseInt(e.target.value) }
                          }))}
                          min="1"
                        />
                      </div>

                      <div>
                        <Label>Delivery Fee (₹)</Label>
                        <Input
                          type="number"
                          value={bookingSettings.delivery.delivery_fee}
                          onChange={(e) => setBookingSettings(prev => ({
                            ...prev,
                            delivery: { ...prev.delivery, delivery_fee: parseInt(e.target.value) }
                          }))}
                          min="0"
                        />
                      </div>

                      <div>
                        <Label>Free Delivery Above (₹)</Label>
                        <Input
                          type="number"
                          value={bookingSettings.delivery.free_delivery_above}
                          onChange={(e) => setBookingSettings(prev => ({
                            ...prev,
                            delivery: { ...prev.delivery, free_delivery_above: parseInt(e.target.value) }
                          }))}
                          min="0"
                        />
                      </div>
                    </div>

                    <div>
                      <Label className="mb-2 block">Service Areas</Label>
                      <div className="flex gap-2 mb-3">
                        <Input
                          placeholder="Enter pincode or area name"
                          value={newServiceArea}
                          onChange={(e) => setNewServiceArea(e.target.value)}
                          onKeyPress={(e) => e.key === 'Enter' && addServiceArea()}
                        />
                        <Button onClick={addServiceArea} size="sm">
                          <Plus className="h-4 w-4 mr-1" />
                          Add
                        </Button>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {bookingSettings.delivery.service_areas.map(area => (
                          <Badge key={area} variant="secondary" className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {area}
                            <button
                              onClick={() => removeServiceArea(area)}
                              className="ml-1 hover:text-red-600"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </Badge>
                        ))}
                      </div>
                      <p className="text-xs text-gray-500 mt-2">Add pincodes or area names where you deliver</p>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Pickup Settings */}
          <TabsContent value="pickup">
            <Card>
              <CardHeader>
                <CardTitle>Pickup Settings</CardTitle>
                <CardDescription>Configure in-store pickup options</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-base font-semibold">Enable Pickup</Label>
                    <p className="text-sm text-gray-500">Allow customers to schedule pickup</p>
                  </div>
                  <Switch
                    checked={bookingSettings.pickup.enabled}
                    onCheckedChange={(checked) => setBookingSettings(prev => ({
                      ...prev,
                      pickup: { ...prev.pickup, enabled: checked }
                    }))}
                  />
                </div>

                {bookingSettings.pickup.enabled && (
                  <div>
                    <Label>Max Slots Per Hour</Label>
                    <Input
                      type="number"
                      value={bookingSettings.pickup.max_slots_per_hour}
                      onChange={(e) => setBookingSettings(prev => ({
                        ...prev,
                        pickup: { ...prev.pickup, max_slots_per_hour: parseInt(e.target.value) }
                      }))}
                      min="1"
                      max="10"
                    />
                    <p className="text-xs text-gray-500 mt-1">Maximum number of pickups per hour</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Save Button */}
        <div className="flex justify-end mt-6">
          <Button
            onClick={saveSettings}
            disabled={saving}
            size="lg"
            className="bg-blue-600 hover:bg-blue-700"
          >
            {saving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save Settings
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

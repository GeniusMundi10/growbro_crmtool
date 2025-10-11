"use client"

import { useState, useEffect } from "react";
import { useUser } from "@/context/UserContext";
import Header from "@/components/header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Calendar, Clock, Phone, User, MapPin, FileText, Package, Truck, CheckCircle, XCircle, Search } from "lucide-react";
import { format } from "date-fns";

interface Booking {
  id: string;
  customer_name: string;
  customer_phone: string;
  customer_email?: string;
  service_type: 'delivery' | 'pickup' | 'consultation';
  date: string;
  time: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  notes?: string;
  created_at: string;
}

interface QuestionnaireResponse {
  id: string;
  questionnaire_type: string;
  customer_data: {
    prescription_details?: string;
    doctor_name?: string;
    medicine_duration?: string;
    delivery_address?: string;
    booking_id?: string;
    appointment_type?: string;
    reason?: string;
    notes?: string;
  };
}

export default function BookingsPage() {
  const { user } = useUser();
  const [aiList, setAiList] = useState<any[]>([]);
  const [selectedAiId, setSelectedAiId] = useState<string | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [questionnaires, setQuestionnaires] = useState<QuestionnaireResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [serviceFilter, setServiceFilter] = useState<string>("all");
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);

  useEffect(() => {
    if (user?.id) {
      fetchBookings();
    }
  }, [user?.id]);

  const fetchBookings = async (aiIdOverride?: string) => {
    try {
      setLoading(true);
      const { supabase } = await import("@/lib/supabase");
      
      // Get all user's AIs
      const { data: aiData } = await supabase
        .from("business_info")
        .select("id, ai_name")
        .eq("user_id", user?.id);

      if (!aiData || aiData.length === 0) return;

      setAiList(aiData);
      
      const defaultAiId = aiData[0]?.id;
      const aiId = aiIdOverride || selectedAiId || defaultAiId;

      if (!aiId) {
        setSelectedAiId(null);
        setBookings([]);
        setQuestionnaires([]);
        return;
      }

      // Update selected AI when first loading or when override supplied
      if (!selectedAiId || aiIdOverride) {
        setSelectedAiId(aiId);
      }

      // Fetch bookings for selected AI
      const { data: bookingsData } = await supabase
        .from("bookings")
        .select("*")
        .eq("ai_id", aiId)
        .order("date", { ascending: false })
        .order("time", { ascending: false });

      // Fetch questionnaire responses
      const { data: questionnaireData } = await supabase
        .from("questionnaire_responses")
        .select("*")
        .eq("ai_id", aiId);

      setBookings(bookingsData || []);
      setQuestionnaires(questionnaireData || []);
    } catch (error) {
      console.error("Error fetching bookings:", error);
    } finally {
      setLoading(false);
    }
  };

  const updateBookingStatus = async (bookingId: string, newStatus: string) => {
    try {
      const { supabase } = await import("@/lib/supabase");
      
      const { error } = await supabase
        .from("bookings")
        .update({ status: newStatus })
        .eq("id", bookingId);

      if (error) throw error;

      // Refresh bookings
      fetchBookings();
      alert("Status updated successfully!");
    } catch (error) {
      console.error("Error updating status:", error);
      alert("Failed to update status");
    }
  };

  const getQuestionnaireForBooking = (bookingId: string) => {
    return questionnaires.find(q => q.customer_data.booking_id === bookingId);
  };

  // Separate bookings by type
  const pharmacyBookings = bookings.filter(b => 
    b.service_type === 'delivery' || b.service_type === 'pickup'
  );
  
  const appointmentBookings = bookings.filter(b => 
    b.service_type === 'consultation'
  );

  const filterBookings = (bookingsList: Booking[]) => {
    return bookingsList.filter(booking => {
      const matchesSearch = 
        booking.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        booking.customer_phone.includes(searchTerm);
      
      const matchesStatus = statusFilter === "all" || booking.status === statusFilter;
      const matchesService = serviceFilter === "all" || booking.service_type === serviceFilter;

      return matchesSearch && matchesStatus && matchesService;
    });
  };

  const filteredPharmacyBookings = filterBookings(pharmacyBookings);
  const filteredAppointmentBookings = filterBookings(appointmentBookings);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'confirmed': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getServiceIcon = (service: string) => {
    switch (service) {
      case 'delivery': return <Truck className="h-4 w-4" />;
      case 'pickup': return <Package className="h-4 w-4" />;
      case 'consultation': return <FileText className="h-4 w-4" />;
      default: return <Calendar className="h-4 w-4" />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
        <Header title="Bookings & Orders" description="Manage prescription orders and appointments" />
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      <Header title="Bookings & Orders" description="Manage prescription orders and appointments" />
      
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Bookings & Orders</h1>
          <p className="text-gray-600">Manage prescription orders and appointments</p>
        </div>

        {/* AI Selector */}
        {aiList.length > 1 && (
          <Card className="mb-6">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <label className="text-sm font-medium min-w-[100px]">Select AI:</label>
                <Select 
                  value={selectedAiId || undefined} 
                  onValueChange={(value) => {
                    fetchBookings(value);
                  }}
                >
                  <SelectTrigger className="w-[300px]">
                    <SelectValue placeholder="Select an AI" />
                  </SelectTrigger>
                  <SelectContent>
                    {aiList.map((ai) => (
                      <SelectItem key={ai.id} value={ai.id}>
                        {ai.ai_name || "Untitled AI"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Bookings</p>
                  <p className="text-2xl font-bold">{bookings.length}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {pharmacyBookings.length} orders, {appointmentBookings.length} appointments
                  </p>
                </div>
                <Calendar className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Pharmacy Orders</p>
                  <p className="text-2xl font-bold text-purple-600">
                    {pharmacyBookings.length}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {pharmacyBookings.filter(b => b.service_type === 'delivery').length} delivery, {pharmacyBookings.filter(b => b.service_type === 'pickup').length} pickup
                  </p>
                </div>
                <Package className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Appointments</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {appointmentBookings.length}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Consultations & checkups
                  </p>
                </div>
                <Calendar className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Pending</p>
                  <p className="text-2xl font-bold text-yellow-600">
                    {bookings.filter(b => b.status === 'pending').length}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Awaiting confirmation
                  </p>
                </div>
                <Clock className="h-8 w-8 text-yellow-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search by name or phone..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="confirmed">Confirmed</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>

              <Select value={serviceFilter} onValueChange={setServiceFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by service" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Services</SelectItem>
                  <SelectItem value="delivery">Delivery</SelectItem>
                  <SelectItem value="pickup">Pickup</SelectItem>
                  <SelectItem value="consultation">Consultation</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Bookings Tabs */}
        <Tabs defaultValue="pharmacy" className="space-y-6">
          <TabsList className="bg-white">
            <TabsTrigger value="pharmacy" className="flex items-center gap-2">
              <Package className="h-4 w-4" />
              Pharmacy Orders ({pharmacyBookings.length})
            </TabsTrigger>
            <TabsTrigger value="appointments" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Appointments ({appointmentBookings.length})
            </TabsTrigger>
          </TabsList>

          {/* Pharmacy Orders Tab */}
          <TabsContent value="pharmacy">
            <div className="space-y-4">
              {filteredPharmacyBookings.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">No pharmacy orders found</p>
                  </CardContent>
                </Card>
              ) : (
                filteredPharmacyBookings.map(booking => {
              const questionnaire = getQuestionnaireForBooking(booking.id);
              
              return (
                <Card key={booking.id} className="hover:shadow-lg transition-shadow">
                  <CardContent className="pt-6">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                      {/* Left: Customer Info */}
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                            <User className="h-5 w-5 text-blue-600" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-lg">{booking.customer_name}</h3>
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <Phone className="h-3 w-3" />
                              {booking.customer_phone}
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                          <div className="flex items-center gap-2">
                            {getServiceIcon(booking.service_type)}
                            <span className="capitalize">{booking.service_type}</span>
                          </div>

                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-gray-600" />
                            {format(new Date(booking.date), "MMM dd, yyyy")}
                          </div>

                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-gray-600" />
                            {booking.time}
                          </div>

                          <Badge className={getStatusColor(booking.status)}>
                            {booking.status}
                          </Badge>
                        </div>

                        {/* Prescription Details */}
                        {questionnaire && (
                          <div className="mt-4 p-3 bg-gray-50 rounded-lg text-sm">
                            <p className="font-semibold mb-2">Prescription Details:</p>
                            <div className="space-y-1 text-gray-700">
                              {questionnaire.customer_data.doctor_name && (
                                <p><strong>Doctor:</strong> {questionnaire.customer_data.doctor_name}</p>
                              )}
                              {questionnaire.customer_data.medicine_duration && (
                                <p><strong>Duration:</strong> {questionnaire.customer_data.medicine_duration}</p>
                              )}
                              {questionnaire.customer_data.prescription_details && (
                                <p><strong>Medicines:</strong> {questionnaire.customer_data.prescription_details}</p>
                              )}
                              {questionnaire.customer_data.delivery_address && (
                                <p className="flex items-start gap-1">
                                  <MapPin className="h-4 w-4 mt-0.5" />
                                  <span>{questionnaire.customer_data.delivery_address}</span>
                                </p>
                              )}
                            </div>
                          </div>
                        )}

                        {booking.notes && (
                          <div className="mt-3 text-sm text-gray-600">
                            <strong>Notes:</strong> {booking.notes}
                          </div>
                        )}
                      </div>

                      {/* Right: Actions */}
                      <div className="flex flex-col gap-2 min-w-[140px]">
                        <Select
                          value={booking.status}
                          onValueChange={(value) => updateBookingStatus(booking.id, value)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="confirmed">Confirmed</SelectItem>
                            <SelectItem value="completed">Completed</SelectItem>
                            <SelectItem value="cancelled">Cancelled</SelectItem>
                          </SelectContent>
                        </Select>

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedBooking(booking)}
                        >
                          View Details
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
            </div>
          </TabsContent>

          {/* Appointments Tab */}
          <TabsContent value="appointments">
            <div className="space-y-4">
              {filteredAppointmentBookings.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">No appointments found</p>
                  </CardContent>
                </Card>
              ) : (
                filteredAppointmentBookings.map(booking => {
                  const questionnaire = getQuestionnaireForBooking(booking.id);
                  
                  return (
                    <Card key={booking.id} className="hover:shadow-lg transition-shadow">
                      <CardContent className="pt-6">
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                          {/* Left: Customer Info */}
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-3">
                              <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                                <User className="h-5 w-5 text-blue-600" />
                              </div>
                              <div>
                                <h3 className="font-semibold text-lg">{booking.customer_name}</h3>
                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                  <Phone className="h-3 w-3" />
                                  {booking.customer_phone}
                                </div>
                              </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                              <div className="flex items-center gap-2">
                                {getServiceIcon(booking.service_type)}
                                <span className="capitalize">{booking.service_type}</span>
                              </div>

                              <div className="flex items-center gap-2">
                                <Calendar className="h-4 w-4 text-gray-600" />
                                {format(new Date(booking.date), "MMM dd, yyyy")}
                              </div>

                              <div className="flex items-center gap-2">
                                <Clock className="h-4 w-4 text-gray-600" />
                                {booking.time}
                              </div>

                              <Badge className={getStatusColor(booking.status)}>
                                {booking.status}
                              </Badge>
                            </div>

                            {/* Appointment Details */}
                            {questionnaire && (
                              <div className="mt-4 p-3 bg-gray-50 rounded-lg text-sm">
                                <p className="font-semibold mb-2">Appointment Details:</p>
                                <div className="space-y-1 text-gray-700">
                                  {questionnaire.customer_data.appointment_type && (
                                    <p><strong>Type:</strong> {questionnaire.customer_data.appointment_type}</p>
                                  )}
                                  {questionnaire.customer_data.reason && (
                                    <p><strong>Reason:</strong> {questionnaire.customer_data.reason}</p>
                                  )}
                                  {questionnaire.customer_data.notes && (
                                    <p><strong>Notes:</strong> {questionnaire.customer_data.notes}</p>
                                  )}
                                </div>
                              </div>
                            )}

                            {booking.notes && (
                              <div className="mt-3 text-sm text-gray-600">
                                <strong>Notes:</strong> {booking.notes}
                              </div>
                            )}
                          </div>

                          {/* Right: Actions */}
                          <div className="flex flex-col gap-2 min-w-[140px]">
                            <Select
                              value={booking.status}
                              onValueChange={(value) => updateBookingStatus(booking.id, value)}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="pending">Pending</SelectItem>
                                <SelectItem value="confirmed">Confirmed</SelectItem>
                                <SelectItem value="completed">Completed</SelectItem>
                                <SelectItem value="cancelled">Cancelled</SelectItem>
                              </SelectContent>
                            </Select>

                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setSelectedBooking(booking)}
                            >
                              View Details
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })
              )}
            </div>
          </TabsContent>
        </Tabs>

        {/* Details Drawer */}
        <Drawer open={!!selectedBooking} onOpenChange={(open) => !open && setSelectedBooking(null)}>
          <DrawerContent>
            <DrawerHeader>
              <DrawerTitle>Booking Details</DrawerTitle>
              <DrawerDescription>
                Full appointment information and questionnaire responses.
              </DrawerDescription>
            </DrawerHeader>

            {selectedBooking && (
              <div className="px-6 py-4 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Customer</p>
                    <p className="text-lg font-semibold">{selectedBooking.customer_name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Phone</p>
                    <p className="text-lg font-medium">{selectedBooking.customer_phone}</p>
                  </div>
                  {selectedBooking.customer_email && (
                    <div>
                      <p className="text-sm text-gray-500">Email</p>
                      <p className="text-lg font-medium">{selectedBooking.customer_email}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-sm text-gray-500">Status</p>
                    <Badge className={getStatusColor(selectedBooking.status)}>
                      {selectedBooking.status}
                    </Badge>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-gray-600" />
                    {format(new Date(selectedBooking.date), "MMM dd, yyyy")}
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-gray-600" />
                    {selectedBooking.time}
                  </div>
                  <div className="flex items-center gap-2">
                    {getServiceIcon(selectedBooking.service_type)}
                    <span className="capitalize">{selectedBooking.service_type}</span>
                  </div>
                  {selectedBooking.notes && (
                    <div className="md:col-span-2">
                      <p className="text-sm text-gray-500">Notes</p>
                      <p className="text-sm text-gray-700 whitespace-pre-wrap">{selectedBooking.notes}</p>
                    </div>
                  )}
                </div>

                <div className="border-t pt-4">
                  <p className="text-sm font-semibold text-gray-700 mb-2">Questionnaire</p>
                  {(() => {
                    const questionnaire = getQuestionnaireForBooking(selectedBooking.id);
                    if (!questionnaire) {
                      return <p className="text-sm text-gray-500">No questionnaire data recorded for this booking.</p>;
                    }

                    const entries = Object.entries(questionnaire.customer_data || {}).filter(([key, value]) =>
                      value !== null && value !== undefined && value !== ""
                    );

                    if (entries.length === 0) {
                      return <p className="text-sm text-gray-500">No additional details available.</p>;
                    }

                    return (
                      <div className="space-y-2">
                        {entries.map(([key, value]) => (
                          <div key={key} className="flex flex-col">
                            <span className="text-xs uppercase text-gray-400">{key.replace(/_/g, " ")}</span>
                            <span className="text-sm text-gray-700 whitespace-pre-wrap">{String(value)}</span>
                          </div>
                        ))}
                      </div>
                    );
                  })()}
                </div>
              </div>
            )}

            <DrawerFooter>
              <DrawerClose asChild>
                <Button variant="outline">Close</Button>
              </DrawerClose>
            </DrawerFooter>
          </DrawerContent>
        </Drawer>
      </div>
    </div>
  );
}

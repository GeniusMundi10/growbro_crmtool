"use client"

import { useState, useEffect } from "react";
import { useUser } from "@/context/UserContext";
import Header from "@/components/header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
  };
}

export default function BookingsPage() {
  const { user } = useUser();
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

  const fetchBookings = async () => {
    try {
      const { supabase } = await import("@/lib/supabase");
      
      // Get user's AI ID
      const { data: aiData } = await supabase
        .from("business_info")
        .select("id")
        .eq("user_id", user?.id)
        .single();

      if (!aiData) return;

      // Fetch bookings
      const { data: bookingsData } = await supabase
        .from("bookings")
        .select("*")
        .eq("ai_id", aiData.id)
        .order("date", { ascending: false })
        .order("time", { ascending: false });

      // Fetch questionnaire responses
      const { data: questionnaireData } = await supabase
        .from("questionnaire_responses")
        .select("*")
        .eq("ai_id", aiData.id);

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

  const filteredBookings = bookings.filter(booking => {
    const matchesSearch = 
      booking.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.customer_phone.includes(searchTerm);
    
    const matchesStatus = statusFilter === "all" || booking.status === statusFilter;
    const matchesService = serviceFilter === "all" || booking.service_type === serviceFilter;

    return matchesSearch && matchesStatus && matchesService;
  });

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
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Bookings & Orders</h1>
          <p className="text-gray-600">Manage prescription orders and appointments</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Bookings</p>
                  <p className="text-2xl font-bold">{bookings.length}</p>
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
                </div>
                <Clock className="h-8 w-8 text-yellow-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Confirmed</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {bookings.filter(b => b.status === 'confirmed').length}
                  </p>
                </div>
                <CheckCircle className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Completed</p>
                  <p className="text-2xl font-bold text-green-600">
                    {bookings.filter(b => b.status === 'completed').length}
                  </p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-600" />
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

        {/* Bookings List */}
        <div className="space-y-4">
          {filteredBookings.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No bookings found</p>
              </CardContent>
            </Card>
          ) : (
            filteredBookings.map(booking => {
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
      </div>
    </div>
  );
}

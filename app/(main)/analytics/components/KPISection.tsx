import React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { MessageSquare, Users, User, Clock } from "lucide-react";

interface KPISectionProps {
  totalMessages: number;
  totalConversations: number;
  totalLeads: number;
  avgConversationDuration: number;
  period: string;
  trendMessages?: number;
  trendConversations?: number;
  trendLeads?: number;
  trendDuration?: number;
}

const formatDuration = (min: number) => `${min.toFixed(1)} min`;

const KPISection: React.FC<KPISectionProps> = ({
  totalMessages,
  totalConversations,
  totalLeads,
  avgConversationDuration,
  period,
  trendMessages,
  trendConversations,
  trendLeads,
  trendDuration,
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      <Card>
        <CardHeader>
          <CardTitle>Total Messages ({period})</CardTitle>
          <CardDescription>Total messages sent in the selected period</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center gap-3">
          <MessageSquare className="w-8 h-8 text-sky-500" />
          <span className="text-2xl font-bold">{totalMessages}</span>
          {trendMessages !== undefined && (
            <span className={`ml-2 text-sm ${trendMessages >= 0 ? "text-green-600" : "text-red-600"}`}>
              {trendMessages >= 0 ? `+${trendMessages}` : trendMessages}
            </span>
          )}
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Total Conversations ({period})</CardTitle>
          <CardDescription>Total conversations started in the selected period</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center gap-3">
          <Users className="w-8 h-8 text-emerald-500" />
          <span className="text-2xl font-bold">{totalConversations}</span>
          {trendConversations !== undefined && (
            <span className={`ml-2 text-sm ${trendConversations >= 0 ? "text-green-600" : "text-red-600"}`}>
              {trendConversations >= 0 ? `+${trendConversations}` : trendConversations}
            </span>
          )}
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Total Leads ({period})</CardTitle>
          <CardDescription>Total unique leads in the selected period</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center gap-3">
          <User className="w-8 h-8 text-fuchsia-600" />
          <span className="text-2xl font-bold">{totalLeads}</span>
          {trendLeads !== undefined && (
            <span className={`ml-2 text-sm ${trendLeads >= 0 ? "text-green-600" : "text-red-600"}`}>
              {trendLeads >= 0 ? `+${trendLeads}` : trendLeads}
            </span>
          )}
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Avg. Conversation Duration ({period})</CardTitle>
          <CardDescription>Average duration of conversations in the selected period</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center gap-3">
          <Clock className="w-8 h-8 text-orange-500" />
          <span className="text-2xl font-bold">{formatDuration(avgConversationDuration)}</span>
          {trendDuration !== undefined && (
            <span className={`ml-2 text-sm ${trendDuration <= 0 ? "text-green-600" : "text-red-600"}`}>
              {trendDuration <= 0 ? `${trendDuration}` : `+${trendDuration}`}
            </span>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default KPISection;

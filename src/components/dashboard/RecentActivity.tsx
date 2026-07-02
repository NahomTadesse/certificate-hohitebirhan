import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

const activities = [
  {
    id: 1,
    patient: "Sarah Johnson",
    action: "New appointment scheduled",
    time: "5 min ago",
    type: "appointment",
  },
  {
    id: 2,
    patient: "Michael Chen",
    action: "Lab results available",
    time: "12 min ago",
    type: "lab",
  },
  {
    id: 3,
    patient: "Emma Davis",
    action: "Payment received",
    time: "1 hour ago",
    type: "payment",
  },
  {
    id: 4,
    patient: "James Wilson",
    action: "Prescription renewed",
    time: "2 hours ago",
    type: "prescription",
  },
  {
    id: 5,
    patient: "Lisa Anderson",
    action: "Check-in completed",
    time: "3 hours ago",
    type: "checkin",
  },
];

const typeColors: Record<string, string> = {
  appointment: "bg-info/10 text-info",
  lab: "bg-warning/10 text-warning",
  payment: "bg-success/10 text-success",
  prescription: "bg-primary/10 text-primary",
  checkin: "bg-secondary/10 text-secondary",
};

export const RecentActivity = () => {
  return (
    <Card className="shadow-soft">
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activities.map((activity) => (
            <div key={activity.id} className="flex items-center gap-4">
              <Avatar>
                <AvatarFallback className="bg-primary/10 text-primary">
                  {activity.patient
                    .split(" ")
                    .map((n) => n[0])
                    .join("")}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{activity.patient}</p>
                <p className="text-sm text-muted-foreground">{activity.action}</p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className={typeColors[activity.type]}>
                  {activity.type}
                </Badge>
                <span className="text-xs text-muted-foreground whitespace-nowrap">
                  {activity.time}
                </span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

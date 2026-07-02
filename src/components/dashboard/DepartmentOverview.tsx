


import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

const departments = [
  { name: "Dispatch", shipments: 28, capacity: 40, utilization: 70 },
  { name: "Logistics", shipments: 35, capacity: 45, utilization: 78 },
  { name: "Fleet", shipments: 42, capacity: 50, utilization: 84 },
  { name: "Maintenance", shipments: 18, capacity: 25, utilization: 72 },
  { name: "Operations", shipments: 15, capacity: 20, utilization: 75 },
];

export const DepartmentOverview = () => {
  return (
    <Card
      className={cn(
        "rounded-xl border border-border/50 bg-card/95 backdrop-blur",
        "supports-[backdrop-filter]:bg-card/80",
        "shadow-soft hover:shadow-lg transition-all duration-300",
        "overflow-hidden"
      )}
    >
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold">Department Overview</CardTitle>
      </CardHeader>

      <CardContent className="pt-2">
        <div className="space-y-5">
          {departments.map((dept) => (
            <div key={dept.name} className="space-y-2">
             
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium text-foreground">{dept.name}</span>
                <span className="text-muted-foreground">
                  {dept.shipments}/{dept.capacity}
                </span>
              </div>

            
              <Progress
                value={dept.utilization}
                className="h-2 bg-muted/30"
         
              />

             
              <div className="flex justify-end">
                <span className="text-xs font-medium text-primary">
                  {dept.utilization}% utilization
                </span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
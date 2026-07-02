

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const data = [
  { name: "Mon", shipments: 45 },
  { name: "Tue", shipments: 52 },
  { name: "Wed", shipments: 48 },
  { name: "Thu", shipments: 61 },
  { name: "Fri", shipments: 55 },
  { name: "Sat", shipments: 38 },
  { name: "Sun", shipments: 28 },
];

export const AppointmentsChart = () => {
  return (
    <Card
      className={cn(
        "rounded-xl border border-border/50 bg-card/95 backdrop-blur",
        "supports-[backdrop-filter]:bg-card/80",
        "shadow-soft hover:shadow-lg transition-all duration-300",
        "overflow-hidden"
      )}
    >
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-semibold">Weekly Shipments</CardTitle>
      </CardHeader>

      <CardContent className="pt-2">
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={data} margin={{ top: 5, right: 10, left: 10, bottom: 0 }}>
            <CartesianGrid
              strokeDasharray="4 4"
              stroke="hsl(var(--border))"
              opacity={0.4}
            />
            <XAxis
              dataKey="name"
              stroke="hsl(var(--muted-foreground))"
              fontSize={12}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              stroke="hsl(var(--muted-foreground))"
              fontSize={12}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "var(--radius)",
                boxShadow: "var(--shadow-md)",
                fontSize: "0.875rem",
              }}
              labelStyle={{ color: "hsl(var(--foreground))" }}
              itemStyle={{ color: "hsl(var(--primary))" }}
            />
            <Line
              type="monotone"
              dataKey="shipments"
              stroke="hsl(var(--primary))"
              strokeWidth={3}
              dot={{ fill: "hsl(var(--primary))", r: 5, strokeWidth: 2, stroke: "hsl(var(--card))" }}
              activeDot={{ r: 7, stroke: "hsl(var(--primary))", strokeWidth: 2 }}
              className="animate-in fade-in duration-700"
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};
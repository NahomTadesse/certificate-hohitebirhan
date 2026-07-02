
import { TrendingUp, TrendingDown, LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: { value: number; isPositive: boolean };
  variant?: "default" | "success" | "warning" | "info";
}

const variantBg = {
  default: "bg-primary/10",
  success: "bg-success/10",
  warning: "bg-warning/10",
  info:    "bg-info/10",
};

const variantText = {
  default: "text-primary",
  success: "text-success",
  warning: "text-warning",
  info:    "text-info",
};

export const StatsCard = ({
  title,
  value,
  icon: Icon,
  trend,
  variant = "default",
}: StatsCardProps) => {
  return (
    <Card
      className={cn(
        "rounded-xl border border-border/50 bg-card/95 backdrop-blur",
        "supports-[backdrop-filter]:bg-card/80",
        "shadow-soft hover:shadow-lg transition-all duration-300",
        "p-4 sm:p-6"
      )}
    >
      <CardContent className="p-0">
        <div className="flex items-center justify-between gap-4">
        
          <div className="flex-1 space-y-1">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold text-foreground">{value}</p>

    
            {trend && (
              <div className="flex items-center gap-1 text-xs">
                {trend.isPositive ? (
                  <TrendingUp className={cn("h-3.5 w-3.5", variantText[variant])} />
                ) : (
                  <TrendingDown className="h-3.5 w-3.5 text-error" />
                )}
                <span
                  className={cn(
                    "font-medium",
                    trend.isPositive ? variantText[variant] : "text-error"
                  )}
                >
                  {Math.abs(trend.value)}%
                </span>
                <span className="text-muted-foreground">vs last month</span>
              </div>
            )}
          </div>

      
          <div
            className={cn(
              "flex h-10 w-10 items-center justify-center rounded-lg",
              variantBg[variant]
            )}
          >
            <Icon className={cn("h-5 w-5", variantText[variant])} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";
import { TrendingUp, TrendingDown } from "lucide-react";

interface MetricCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  change?: number;
  changeLabel?: string;
}

export default function MetricCard({
  title,
  value,
  icon: Icon,
  change,
  changeLabel = "vs last month",
}: MetricCardProps) {
  const isPositive = change !== undefined && change >= 0;
  const testId = `metric-card-${title.toLowerCase().replace(/\s+/g, '-')}`;

  return (
    <Card data-testid={testId}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground" data-testid={`${testId}-title`}>
          {title}
        </CardTitle>
        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center" data-testid={`${testId}-icon`}>
          <Icon className="h-5 w-5 text-primary" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold" data-testid={`${testId}-value`}>
          {value}
        </div>
        {change !== undefined && (
          <div className="flex items-center gap-1 mt-2 text-sm" data-testid={`${testId}-change-container`}>
            {isPositive ? (
              <TrendingUp className="h-4 w-4 text-primary" />
            ) : (
              <TrendingDown className="h-4 w-4 text-destructive" />
            )}
            <span
              className={isPositive ? "text-primary" : "text-destructive"}
              data-testid={`${testId}-change-value`}
            >
              {isPositive ? "+" : ""}
              {change}%
            </span>
            <span className="text-muted-foreground" data-testid={`${testId}-change-label`}>{changeLabel}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

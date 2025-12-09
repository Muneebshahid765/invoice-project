"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function InvoiceStats({ stats, loading, currency = "PKR" }) {
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-PK', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount || 0);
  };

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-4 w-24" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-32" />
              <Skeleton className="h-3 w-20 mt-2" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const cards = [
    {
      title: "Total Revenue",
      value: formatCurrency(stats?.revenue?.total),
      description: `${stats?.total?.invoices || 0} total invoices`,
      icon: "💰",
    },
    {
      title: "Paid",
      value: formatCurrency(stats?.revenue?.paid),
      description: `${stats?.total?.paid || 0} invoices paid`,
      icon: "✅",
    },
    {
      title: "Pending",
      value: formatCurrency(stats?.revenue?.pending),
      description: `${stats?.total?.sent || 0} awaiting payment`,
      icon: "⏳",
    },
    {
      title: "Overdue",
      value: formatCurrency(stats?.revenue?.overdue),
      description: `${stats?.total?.overdue || 0} need attention`,
      icon: "⚠️",
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {cards.map((card, index) => (
        <Card key={index}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {card.title}
            </CardTitle>
            <span className="text-xl">{card.icon}</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{card.value}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {card.description}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export default InvoiceStats;

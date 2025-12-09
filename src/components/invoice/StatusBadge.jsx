import { Badge } from "@/components/ui/badge";

const statusConfig = {
  DRAFT: {
    label: "Draft",
    variant: "secondary",
    className: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100",
  },
  SENT: {
    label: "Sent",
    variant: "default",
    className: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100",
  },
  PAID: {
    label: "Paid",
    variant: "success",
    className: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100",
  },
  OVERDUE: {
    label: "Overdue",
    variant: "destructive",
    className: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100",
  },
  CANCELLED: {
    label: "Cancelled",
    variant: "outline",
    className: "bg-gray-50 text-gray-500 dark:bg-gray-900 dark:text-gray-400",
  },
};

export function StatusBadge({ status }) {
  const config = statusConfig[status] || statusConfig.DRAFT;

  return (
    <Badge className={config.className}>
      {config.label}
    </Badge>
  );
}

export default StatusBadge;

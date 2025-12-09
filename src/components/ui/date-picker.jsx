"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const DatePicker = React.forwardRef(
  ({ className, value, onChange, placeholder = "Select date", ...props }, ref) => {
    const formatDate = (date) => {
      if (!date) return '';
      const d = new Date(date);
      return d.toISOString().split('T')[0];
    };

    const handleChange = (e) => {
      const newDate = e.target.value ? new Date(e.target.value) : null;
      onChange?.(newDate);
    };

    return (
      <Input
        ref={ref}
        type="date"
        className={cn("w-full", className)}
        value={formatDate(value)}
        onChange={handleChange}
        {...props}
      />
    );
  }
);
DatePicker.displayName = "DatePicker";

export { DatePicker };

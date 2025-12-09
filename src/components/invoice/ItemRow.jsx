"use client";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

export function ItemRow({ item, index, onChange, onRemove, currency = "PKR", canRemove = true }) {
  const handleChange = (field, value) => {
    const updatedItem = { ...item, [field]: value };
    
    // Auto-calculate total
    if (field === 'quantity' || field === 'price') {
      const qty = field === 'quantity' ? parseFloat(value) || 0 : parseFloat(item.quantity) || 0;
      const price = field === 'price' ? parseFloat(value) || 0 : parseFloat(item.price) || 0;
      updatedItem.total = qty * price;
    }
    
    onChange(index, updatedItem);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-PK', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
    }).format(amount || 0);
  };

  return (
    <div className="grid grid-cols-12 gap-2 items-start p-3 bg-muted/30 rounded-lg mb-2">
      <div className="col-span-12 md:col-span-5">
        <Textarea
          placeholder="Item description"
          value={item.description || ''}
          onChange={(e) => handleChange('description', e.target.value)}
          rows={1}
          className="min-h-[38px] resize-none"
        />
      </div>
      <div className="col-span-4 md:col-span-2">
        <Input
          type="number"
          placeholder="Qty"
          min="0"
          step="1"
          value={item.quantity || ''}
          onChange={(e) => handleChange('quantity', e.target.value)}
        />
      </div>
      <div className="col-span-4 md:col-span-2">
        <Input
          type="number"
          placeholder="Price"
          min="0"
          step="0.01"
          value={item.price || ''}
          onChange={(e) => handleChange('price', e.target.value)}
        />
      </div>
      <div className="col-span-3 md:col-span-2 flex items-center justify-end">
        <span className="text-sm font-medium">
          {formatCurrency(item.total || 0)}
        </span>
      </div>
      <div className="col-span-1 flex justify-end">
        {canRemove && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onRemove(index)}
            className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
          >
            ✕
          </Button>
        )}
      </div>
    </div>
  );
}

export default ItemRow;

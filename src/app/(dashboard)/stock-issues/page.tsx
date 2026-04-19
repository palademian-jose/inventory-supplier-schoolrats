"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { PageHeader } from "@/components/page-header";
import { LoadingState } from "@/components/loading-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface User {
  id: number;
  full_name: string;
}

interface Item {
  id: number;
  name: string;
  stock_quantity: number;
}

const emptyForm = {
  user_id: "",
  item_id: "",
  quantity: "1",
  notes: "",
};

export default function StockIssuesPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    const loadOptions = async () => {
      try {
        const [userRes, itemRes] = await Promise.all([
          fetch("/api/users?page=1&limit=100"),
          fetch("/api/items?page=1&limit=100"),
        ]);
        if (userRes.ok) {
          const data = await userRes.json();
          setUsers(data.data);
        }
        if (itemRes.ok) {
          const data = await itemRes.json();
          setItems(data.data);
        }
      } catch {
        toast.error("Failed to load stock issue form data");
      } finally {
        setLoading(false);
      }
    };
    loadOptions();
  }, []);

  const validateForm = () => {
    const nextErrors: Record<string, string> = {};
    if (!form.user_id) nextErrors.user_id = "User is required";
    if (!form.item_id) nextErrors.item_id = "Item is required";
    if (!form.quantity || Number(form.quantity) <= 0) {
      nextErrors.quantity = "Quantity must be greater than zero";
    }
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!validateForm()) {
      toast.error("Please complete the issue form");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/stock-issues", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: Number(form.user_id),
          item_id: Number(form.item_id),
          quantity: Number(form.quantity),
          notes: form.notes,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Unable to issue stock");
      }

      toast.success("Stock issued successfully");
      setErrors({});
      setForm({ ...emptyForm });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to issue stock");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingState label="Loading stock issue form..." />;

  return (
    <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
      <Card>
        <CardContent className="pt-6">
          <PageHeader
            eyebrow="Internal Fulfillment"
            title="Record a Stock Issue"
            description="Select the user, choose an item, and record the quantity issued."
          />

          <form className="mt-6 grid gap-4" onSubmit={handleSubmit}>
            <div>
              <Label className="mb-1.5">User</Label>
              <Select
                value={form.user_id}
                onValueChange={(val) => {
                  setForm((prev) => ({ ...prev, user_id: val }));
                  setErrors((prev) => ({ ...prev, user_id: "" }));
                }}
              >
                <SelectTrigger className={errors.user_id ? "border-destructive" : ""}>
                  <SelectValue placeholder="Select user" />
                </SelectTrigger>
                <SelectContent>
                  {users.map((u) => (
                    <SelectItem key={u.id} value={String(u.id)}>
                      {u.full_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.user_id && (
                <p className="mt-1 text-xs text-destructive">{errors.user_id}</p>
              )}
            </div>

            <div>
              <Label className="mb-1.5">Item</Label>
              <Select
                value={form.item_id}
                onValueChange={(val) => {
                  setForm((prev) => ({ ...prev, item_id: val }));
                  setErrors((prev) => ({ ...prev, item_id: "" }));
                }}
              >
                <SelectTrigger className={errors.item_id ? "border-destructive" : ""}>
                  <SelectValue placeholder="Select item" />
                </SelectTrigger>
                <SelectContent>
                  {items.map((item) => (
                    <SelectItem key={item.id} value={String(item.id)}>
                      {item.name} (Stock: {item.stock_quantity})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.item_id && (
                <p className="mt-1 text-xs text-destructive">{errors.item_id}</p>
              )}
            </div>

            <div>
              <Label className="mb-1.5">Quantity</Label>
              <Input
                type="number"
                min={1}
                className={errors.quantity ? "border-destructive" : ""}
                value={form.quantity}
                onChange={(e) => {
                  setForm((prev) => ({ ...prev, quantity: e.target.value }));
                  setErrors((prev) => ({ ...prev, quantity: "" }));
                }}
              />
              {errors.quantity && (
                <p className="mt-1 text-xs text-destructive">{errors.quantity}</p>
              )}
            </div>

            <div>
              <Label className="mb-1.5">Notes</Label>
              <Textarea
                className="min-h-28"
                value={form.notes}
                onChange={(e) => setForm((prev) => ({ ...prev, notes: e.target.value }))}
              />
            </div>

            <Button type="submit" disabled={saving}>
              {saving ? "Recording..." : "Record Issue"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <h3 className="text-xl font-semibold tracking-tight">How It Works</h3>
          <ul className="mt-4 space-y-3 text-sm text-muted-foreground">
            <li>Stock is reduced automatically after a successful issue.</li>
            <li>
              A stock transaction is created with type{" "}
              <strong className="text-foreground">STOCK_ISSUE</strong>.
            </li>
            <li>Server-side validation prevents zero quantity and negative stock.</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}

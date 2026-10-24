"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Plus, Ticket, RefreshCw } from "lucide-react";
import { useTranslation } from "react-i18next";

import DashboardLayout from "../dashboard/layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  PromoCode,
  PromoCodePayload,
  DiscountType,
  fetchPromoCodes,
  createPromoCode,
  deactivatePromoCode,
} from "@/services/promoCodeService";
import { PAYMENT_FEE_TYPES, PaymentFeeType } from "@/services/paymentService";
import { fetchChurchesForDropdown } from "@/services/churchService";

const emptyForm = {
  code: "",
  description: "",
  discountType: "PERCENT" as DiscountType,
  discountValue: "",
  churchId: "",
  validFrom: "",
  validTo: "",
  maxUses: "",
  oncePerChild: false,
  applicableTypes: [] as PaymentFeeType[],
};

export default function PromoCodesPage() {
  const { t } = useTranslation();
  const [codes, setCodes] = useState<PromoCode[]>([]);
  const [churches, setChurches] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(emptyForm);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setCodes(await fetchPromoCodes());
    } catch (err: any) {
      toast.error(err.message || t("Failed to load promo codes"));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    load();
    fetchChurchesForDropdown().then(setChurches).catch(() => setChurches([]));
  }, [load]);

  const toggleType = (type: PaymentFeeType) =>
    setForm((f) => ({
      ...f,
      applicableTypes: f.applicableTypes.includes(type)
        ? f.applicableTypes.filter((x) => x !== type)
        : [...f.applicableTypes, type],
    }));

  const handleCreate = async () => {
    if (!form.code.trim()) {
      toast.error(t("Promo code is required"));
      return;
    }
    if (form.discountType !== "FREE" && !form.discountValue) {
      toast.error(t("Enter a discount value"));
      return;
    }
    const payload: PromoCodePayload = {
      code: form.code.trim().toUpperCase(),
      description: form.description || undefined,
      discountType: form.discountType,
      discountValue: form.discountType === "FREE" ? undefined : parseFloat(form.discountValue),
      churchId: form.churchId || undefined,
      applicableTypes: form.applicableTypes.length ? form.applicableTypes : undefined,
      validFrom: form.validFrom || undefined,
      validTo: form.validTo || undefined,
      maxUses: form.maxUses ? parseInt(form.maxUses, 10) : undefined,
      oncePerChild: form.oncePerChild,
    };
    setSaving(true);
    try {
      await createPromoCode(payload);
      toast.success(t("Promo code created"));
      setOpen(false);
      setForm(emptyForm);
      await load();
    } catch (err: any) {
      toast.error(err.message || t("Operation failed"));
    } finally {
      setSaving(false);
    }
  };

  const handleDeactivate = async (code?: string) => {
    if (!code) return;
    try {
      await deactivatePromoCode(code);
      toast.success(t("Promo code deactivated"));
      await load();
    } catch (err: any) {
      toast.error(err.message || t("Operation failed"));
    }
  };

  const discountText = (c: PromoCode) =>
    c.discountType === "FREE" ? t("Free") : c.discountType === "PERCENT" ? `${c.discountValue ?? 0}%` : `${c.discountValue ?? 0}`;

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Ticket className="h-8 w-8 text-primary" /> {t("Promo Codes")}
            </h1>
            <p className="text-muted-foreground">{t("Create discount codes that can be applied to payments")}</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="icon" onClick={load} disabled={loading}>
              <RefreshCw className="h-4 w-4" />
            </Button>
            <Button onClick={() => setOpen(true)}>
              <Plus className="h-4 w-4 mr-2" /> {t("New Promo Code")}
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{t("All Promo Codes")}</CardTitle>
            <CardDescription>{t("Deactivate a code to stop it from being used")}</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("Code")}</TableHead>
                  <TableHead>{t("Discount")}</TableHead>
                  <TableHead>{t("Applies to")}</TableHead>
                  <TableHead>{t("Valid")}</TableHead>
                  <TableHead>{t("Uses")}</TableHead>
                  <TableHead>{t("Status")}</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground py-6">
                      {t("Loading...")}
                    </TableCell>
                  </TableRow>
                )}
                {!loading && codes.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground py-6">
                      {t("No promo codes yet")}
                    </TableCell>
                  </TableRow>
                )}
                {codes.map((c, i) => (
                  <TableRow key={c.code || i}>
                    <TableCell>
                      <div className="font-mono font-semibold">{c.code}</div>
                      {c.description && <div className="text-xs text-muted-foreground">{c.description}</div>}
                    </TableCell>
                    <TableCell>{discountText(c)}</TableCell>
                    <TableCell className="text-xs max-w-[14rem]">
                      {c.applicableTypes?.length ? c.applicableTypes.map((x) => t(x)).join(", ") : t("All types")}
                    </TableCell>
                    <TableCell className="text-xs">
                      {c.validFrom || "—"} → {c.validTo || "—"}
                    </TableCell>
                    <TableCell className="text-xs">
                      {c.usedCount ?? 0}
                      {c.maxUses ? ` / ${c.maxUses}` : ""}
                      {c.oncePerChild ? ` · ${t("once per child")}` : ""}
                    </TableCell>
                    <TableCell>
                      <Badge className={c.active === false ? "bg-red-100 text-red-800" : "bg-green-100 text-green-800"}>
                        {c.active === false ? t("Inactive") : t("Active")}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {c.active !== false && (
                        <Button size="sm" variant="outline" onClick={() => handleDeactivate(c.code)}>
                          {t("Deactivate")}
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{t("New Promo Code")}</DialogTitle>
            </DialogHeader>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label>{t("Code")} *</Label>
                <Input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} />
              </div>
              <div>
                <Label>{t("Description")}</Label>
                <Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              </div>
              <div>
                <Label>{t("Discount Type")} *</Label>
                <Select value={form.discountType} onValueChange={(v) => setForm({ ...form, discountType: v as DiscountType })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PERCENT">{t("Percent")}</SelectItem>
                    <SelectItem value="FIXED">{t("Fixed amount")}</SelectItem>
                    <SelectItem value="FREE">{t("Free")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>{t("Discount Value")}</Label>
                <Input
                  type="number"
                  min={0}
                  disabled={form.discountType === "FREE"}
                  value={form.discountValue}
                  onChange={(e) => setForm({ ...form, discountValue: e.target.value })}
                />
              </div>
              <div>
                <Label>{t("Church (optional)")}</Label>
                <Select value={form.churchId || "all"} onValueChange={(v) => setForm({ ...form, churchId: v === "all" ? "" : v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t("All churches")}</SelectItem>
                    {churches.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>{t("Max Uses")}</Label>
                <Input type="number" min={1} value={form.maxUses} onChange={(e) => setForm({ ...form, maxUses: e.target.value })} />
              </div>
              <div>
                <Label>{t("Valid From")}</Label>
                <Input type="date" value={form.validFrom} onChange={(e) => setForm({ ...form, validFrom: e.target.value })} />
              </div>
              <div>
                <Label>{t("Valid To")}</Label>
                <Input type="date" value={form.validTo} onChange={(e) => setForm({ ...form, validTo: e.target.value })} />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox checked={form.oncePerChild} onCheckedChange={(v) => setForm({ ...form, oncePerChild: Boolean(v) })} />
              <Label>{t("Can be used only once per child")}</Label>
            </div>
            <div>
              <Label>{t("Applicable payment types (none selected = all)")}</Label>
              <div className="grid grid-cols-2 gap-2 mt-2">
                {PAYMENT_FEE_TYPES.map((type) => (
                  <label key={type} className="flex items-center gap-2 text-sm">
                    <Checkbox checked={form.applicableTypes.includes(type)} onCheckedChange={() => toggleType(type)} />
                    {t(type)}
                  </label>
                ))}
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)} disabled={saving}>
                {t("Cancel")}
              </Button>
              <Button onClick={handleCreate} disabled={saving}>
                {saving ? t("Saving...") : t("Create")}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}

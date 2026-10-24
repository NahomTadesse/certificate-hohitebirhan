"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Coins, RefreshCw } from "lucide-react";
import { useTranslation } from "react-i18next";

import DashboardLayout from "../dashboard/layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PAYMENT_FEE_TYPES, PaymentFeeType } from "@/services/paymentService";
import { fetchStandardFee, setFee } from "@/services/feeService";
import { fetchChurchesForDropdown } from "@/services/churchService";

const readAmount = (res: any): string => {
  const d = res?.data;
  if (d === undefined || d === null) return "—";
  if (typeof d === "number") return String(d);
  if (typeof d === "object") return String(d.amount ?? d.fee ?? d.standardRate ?? JSON.stringify(d));
  return String(d);
};

export default function FeesPage() {
  const { t } = useTranslation();
  const [churches, setChurches] = useState<{ id: string; name: string }[]>([]);
  const [churchId, setChurchId] = useState(""); // "" = system default
  const [current, setCurrent] = useState<Record<string, string>>({});
  const [edit, setEdit] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [savingType, setSavingType] = useState<string | null>(null);

  useEffect(() => {
    fetchChurchesForDropdown().then(setChurches).catch(() => setChurches([]));
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const entries = await Promise.all(
        PAYMENT_FEE_TYPES.map(async (type) => {
          try {
            return [type, readAmount(await fetchStandardFee(type, 1, churchId || undefined))] as const;
          } catch {
            return [type, "—"] as const;
          }
        })
      );
      setCurrent(Object.fromEntries(entries));
    } finally {
      setLoading(false);
    }
  }, [churchId]);

  useEffect(() => {
    load();
  }, [load]);

  const save = async (type: PaymentFeeType) => {
    const amount = parseFloat(edit[type]);
    if (Number.isNaN(amount) || amount < 0) {
      toast.error(t("Enter a valid amount"));
      return;
    }
    setSavingType(type);
    try {
      await setFee(type, amount, churchId || undefined);
      toast.success(t("Fee updated"));
      setEdit((e) => ({ ...e, [type]: "" }));
      await load();
    } catch (err: any) {
      toast.error(err.message || t("Operation failed"));
    } finally {
      setSavingType(null);
    }
  };

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Coins className="h-8 w-8 text-primary" /> {t("Fees")}
            </h1>
            <p className="text-muted-foreground">{t("Set the standard fee for each payment type")}</p>
          </div>
          <Button variant="outline" size="icon" onClick={load} disabled={loading}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{t("Scope")}</CardTitle>
            <CardDescription>{t("Leave on 'All churches' to change the default fee, or pick a church to set its own fee")}</CardDescription>
          </CardHeader>
          <CardContent className="max-w-sm">
            <Label>{t("Church")}</Label>
            <Select value={churchId || "all"} onValueChange={(v) => setChurchId(v === "all" ? "" : v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("All churches (default)")}</SelectItem>
                {churches.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("Payment Type")}</TableHead>
                  <TableHead>{t("Current fee")}</TableHead>
                  <TableHead>{t("New amount")}</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {PAYMENT_FEE_TYPES.map((type) => (
                  <TableRow key={type}>
                    <TableCell className="font-medium">{t(type)}</TableCell>
                    <TableCell>{loading ? "…" : current[type] ?? "—"}</TableCell>
                    <TableCell className="w-48">
                      <Input
                        type="number"
                        min={0}
                        step="0.01"
                        value={edit[type] ?? ""}
                        onChange={(e) => setEdit({ ...edit, [type]: e.target.value })}
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      <Button size="sm" onClick={() => save(type)} disabled={savingType === type || !edit[type]}>
                        {savingType === type ? t("Saving...") : t("Save")}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}

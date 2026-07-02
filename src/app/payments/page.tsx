"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import {
  Banknote,
  CheckCircle,
  XCircle,
  AlertCircle,
  CalendarDays,
  Wallet,
  Receipt,
  User,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import DashboardLayout from "../dashboard/layout";
import { makePayment, PaymentType } from "@/services/paymentService";
import { fetchChildrenForDropdown } from "@/services/childrenService";
import { useTranslation } from "react-i18next";
import { useSearchParams } from "next/navigation";

function PaymentsPageWra() {
  const { t } = useTranslation();
  const searchParams = useSearchParams();
  const preselectedChildId = searchParams?.get("childId") || "";
  const [children, setChildren] = useState<{ id: string; fullName: string }[]>([]);
  const [loadingChildren, setLoadingChildren] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [alert, setAlert] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [lastReceipt, setLastReceipt] = useState<null | {
    childName: string;
    rate: number;
    type: PaymentType;
    months: number;
    total: number;
    date: string;
  }>(null);

  const [formState, setFormState] = useState({
    childId: preselectedChildId,
    rate: "",
    type: "MONTHLY" as PaymentType,
    months: "1",
  });

  const loadChildren = useCallback(async () => {
    setLoadingChildren(true);
    try {
      const data = await fetchChildrenForDropdown();
      setChildren(data || []);
    } catch (err) {
      // silently fail, dropdown will just be empty
    } finally {
      setLoadingChildren(false);
    }
  }, []);

  useEffect(() => {
    loadChildren();
  }, [loadChildren]);

  const rateNum = parseFloat(formState.rate) || 0;
  const monthsNum = parseInt(formState.months) || 0;
  const total = rateNum * monthsNum;

  const handleSubmit = async () => {
    if (!formState.childId || !formState.rate || !formState.months) {
      setAlert({ type: "error", message: "Please fill in child, rate, and months." });
      return;
    }

    setIsSubmitting(true);
    setAlert(null);
    try {
      await makePayment({
        childId: formState.childId,
        rate: rateNum,
        type: formState.type,
        months: monthsNum,
      });

      const childName = children.find((c) => c.id === formState.childId)?.fullName || "-";
      setLastReceipt({
        childName,
        rate: rateNum,
        type: formState.type,
        months: monthsNum,
        total,
        date: new Date().toLocaleString(),
      });

      setAlert({ type: "success", message: "Payment recorded successfully!" });
      setFormState({ childId: "", rate: "", type: "MONTHLY", months: "1" });
      setTimeout(() => setAlert(null), 3000);
    } catch (err: any) {
      setAlert({ type: "error", message: err.message || "Payment failed" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Banknote className="h-8 w-8 text-primary" /> {t("Payments")}
          </h1>
          <p className="text-muted-foreground">{t("Record membership payments for children")}</p>
        </div>

        {alert && (
          <Alert variant={alert.type === "error" ? "destructive" : "default"}>
            {alert.type === "success" ? <CheckCircle className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
            <AlertDescription>{alert.message}</AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wallet className="h-5 w-5 text-primary" /> {t("New Payment")}
              </CardTitle>
              <CardDescription>{t("Choose a child and enter payment details")}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>{t("Child")} *</Label>
                <Select
                  value={formState.childId}
                  onValueChange={(v) => setFormState({ ...formState, childId: v })}
                  disabled={loadingChildren}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={loadingChildren ? t("Loading...") : t("Select a child")} />
                  </SelectTrigger>
                  <SelectContent>
                    {children.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.fullName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>{t("Payment Type")} *</Label>
                  <Select
                    value={formState.type}
                    onValueChange={(v) => setFormState({ ...formState, type: v as PaymentType })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="MONTHLY">{t("Monthly")}</SelectItem>
                      <SelectItem value="PREPAID">{t("Prepaid")}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>{t("Months")} *</Label>
                  <Input
                    type="number"
                    min={1}
                    value={formState.months}
                    onChange={(e) => setFormState({ ...formState, months: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <Label>{t("Rate (per month)")} *</Label>
                <Input
                  type="number"
                  min={0}
                  step="0.01"
                  value={formState.rate}
                  onChange={(e) => setFormState({ ...formState, rate: e.target.value })}
                  placeholder="0.00"
                />
              </div>

              <div className="flex items-center justify-between p-4 rounded-lg bg-primary/5 border border-primary/10">
                <span className="text-sm text-muted-foreground">{t("Total to pay")}</span>
                <span className="text-2xl font-bold text-primary">{total.toFixed(2)}</span>
              </div>

              <Button onClick={handleSubmit} disabled={isSubmitting} size="lg" className="w-full">
                {isSubmitting ? t("Processing...") : t("Record Payment")}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Receipt className="h-5 w-5 text-primary" /> {t("Last Receipt")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!lastReceipt ? (
                <div className="text-center text-muted-foreground py-10 text-sm">
                  {t("No payment recorded yet in this session.")}
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">{lastReceipt.childName}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{t("Type")}</span>
                    <span>{lastReceipt.type}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{t("Months")}</span>
                    <span>{lastReceipt.months}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{t("Rate")}</span>
                    <span>{lastReceipt.rate.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-base font-bold pt-2 border-t">
                    <span>{t("Total")}</span>
                    <span className="text-primary">{lastReceipt.total.toFixed(2)}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground pt-2">
                    <CalendarDays className="h-3 w-3" /> {lastReceipt.date}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}


export default function PaymentsPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <PaymentsPageWra />
    </Suspense>
  );
}
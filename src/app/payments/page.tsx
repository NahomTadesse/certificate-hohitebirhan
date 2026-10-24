"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { toast } from "sonner";
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

import { Badge } from "@/components/ui/badge";
import DashboardLayout from "../dashboard/layout";
import {
  makePayment,
  PaymentType,
  fetchPaymentHistory,
  fetchPaymentsReport,
  waiveCertificateFee,
  payCertificateFee,
  quotePayment,
  fetchPaymentByReceipt,
  canIssueCertificate,
  CERTIFICATE_FEE_KINDS,
  CertificateFeeKind,
  certificateFeeType,
  Payment,
  PaymentReportType,
} from "@/services/paymentService";
import { fetchChildrenForDropdown } from "@/services/childrenService";
import SearchableSelect from "@/components/SearchableSelect";
import { useTranslation } from "react-i18next";
import { useSearchParams } from "next/navigation";

function PaymentsPageWra() {
  const { t } = useTranslation();
  const searchParams = useSearchParams();
  const preselectedChildId = searchParams?.get("childId") || "";
  const [children, setChildren] = useState<{ id: string; fullName: string }[]>([]);
  const [loadingChildren, setLoadingChildren] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
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
    promoCode: "",
  });
  const [quote, setQuote] = useState<any>(null);
  const [quoting, setQuoting] = useState(false);

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
    if (!formState.childId || !formState.months) {
      toast.error("Please fill in child and months.");
      return;
    }

    setIsSubmitting(true);
    try {
      await makePayment({
        childId: formState.childId,
        rate: formState.rate ? rateNum : undefined, // blank = standard fee
        type: formState.type,
        months: monthsNum,
        promoCode: formState.promoCode.trim() || undefined,
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

      toast.success("Payment recorded successfully!");
      setFormState({ childId: "", rate: "", type: "MONTHLY", months: "1", promoCode: "" });
      setQuote(null);
    } catch (err: any) {
      toast.error(err.message || "Payment failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- Price quote (preview with promo code / custom rate, nothing is saved) ---
  const handleQuote = async () => {
    if (!formState.childId) {
      toast.error("Select a child first.");
      return;
    }
    setQuoting(true);
    try {
      const res = await quotePayment({
        childId: formState.childId,
        type: "MEMBERSHIP",
        months: monthsNum || 1,
        promoCode: formState.promoCode.trim() || undefined,
        customAmount: formState.rate ? rateNum * (monthsNum || 1) : undefined,
        customReason: formState.rate ? "Custom membership rate" : undefined,
      });
      setQuote(res?.data ?? res);
    } catch (err: any) {
      setQuote(null);
      toast.error(err.message || "Could not get a quote");
    } finally {
      setQuoting(false);
    }
  };

  // --- Pay certificate fee ---
  const [certFee, setCertFee] = useState({
    childId: "",
    certificateType: "BAPTISM" as CertificateFeeKind,
    customRate: "",
    customReason: "",
    promoCode: "",
  });
  const [certQuote, setCertQuote] = useState<any>(null);
  const [certBusy, setCertBusy] = useState(false);
  const [canIssue, setCanIssue] = useState<boolean | null>(null);

  const handleCertQuote = async () => {
    if (!certFee.childId) return toast.error("Select a child first.");
    setCertBusy(true);
    try {
      const res = await quotePayment({
        childId: certFee.childId,
        type: certificateFeeType(certFee.certificateType),
        customAmount: certFee.customRate ? parseFloat(certFee.customRate) : undefined,
        customReason: certFee.customReason || undefined,
        promoCode: certFee.promoCode.trim() || undefined,
      });
      setCertQuote(res?.data ?? res);
      setCanIssue(await canIssueCertificate(certFee.childId, certFee.certificateType));
    } catch (err: any) {
      setCertQuote(null);
      toast.error(err.message || "Could not get a quote");
    } finally {
      setCertBusy(false);
    }
  };

  const handlePayCertificate = async () => {
    if (!certFee.childId) return toast.error("Select a child first.");
    setCertBusy(true);
    try {
      await payCertificateFee(
        certFee.childId,
        certFee.certificateType,
        certFee.customRate ? parseFloat(certFee.customRate) : undefined,
        certFee.customReason || undefined,
        certFee.promoCode.trim() || undefined
      );
      toast.success("Certificate fee paid successfully!");
      setCertFee({ ...certFee, customRate: "", customReason: "", promoCode: "" });
      setCertQuote(null);
      setCanIssue(await canIssueCertificate(certFee.childId, certFee.certificateType));
    } catch (err: any) {
      toast.error(err.message || "Payment failed");
    } finally {
      setCertBusy(false);
    }
  };

  // --- Receipt lookup ---
  const [receiptNo, setReceiptNo] = useState("");
  const [receipt, setReceipt] = useState<any>(null);
  const handleReceipt = async () => {
    if (!receiptNo.trim()) return;
    try {
      const res = await fetchPaymentByReceipt(receiptNo.trim());
      setReceipt(res?.data ?? res);
    } catch (err: any) {
      setReceipt(null);
      toast.error(err.message || "Receipt not found");
    }
  };

  // --- History lookup ---
  const [historyChildId, setHistoryChildId] = useState("");
  const [history, setHistory] = useState<Payment[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const handleLoadHistory = async () => {
    if (!historyChildId) return;
    setLoadingHistory(true);
    try {
      const data = await fetchPaymentHistory(historyChildId);
      setHistory(data || []);
    } catch (err: any) {
      toast.error(err.message || "Failed to load payment history");
    } finally {
      setLoadingHistory(false);
    }
  };

  // --- Waive certificate fee ---
  const [waiveChildId, setWaiveChildId] = useState("");
  const [waiveReason, setWaiveReason] = useState("");
  const [waiveType, setWaiveType] = useState<CertificateFeeKind>("BAPTISM");
  const [isWaiving, setIsWaiving] = useState(false);

  const handleWaive = async () => {
    if (!waiveChildId || !waiveReason) {
      toast.error("Select a child and provide a reason to waive the fee.");
      return;
    }
    setIsWaiving(true);
    try {
      await waiveCertificateFee(waiveChildId, waiveType, waiveReason);
      toast.success("Certificate fee waived successfully!");
      setWaiveChildId("");
      setWaiveReason("");
    } catch (err: any) {
      toast.error(err.message || "Failed to waive fee");
    } finally {
      setIsWaiving(false);
    }
  };

  // --- Report ---
  const [reportType, setReportType] = useState<PaymentReportType>("MEMBERSHIP");
  const [reportStart, setReportStart] = useState("");
  const [reportEnd, setReportEnd] = useState("");
  const [report, setReport] = useState<Payment[]>([]);
  const [loadingReport, setLoadingReport] = useState(false);

  const handleLoadReport = async () => {
    if (!reportStart || !reportEnd) {
      toast.error("Select a start and end date for the report.");
      return;
    }
    setLoadingReport(true);
    try {
      const data = await fetchPaymentsReport(reportType, reportStart, reportEnd);
      setReport(data || []);
    } catch (err: any) {
      toast.error(err.message || "Failed to load report");
    } finally {
      setLoadingReport(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Banknote className="h-8 w-8 text-primary" /> {t("Payments")}
            </h1>
            <p className="text-muted-foreground">{t("Record membership payments for children")}</p>
          </div>
          <Button variant="outline" onClick={() => (window.location.href = "/payment-reports")}>
            {t("View Payment Reports")}
          </Button>
        </div>

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
                <SearchableSelect
                  value={formState.childId}
                  onChange={(v) => setFormState({ ...formState, childId: v })}
                  options={children.map((c) => ({ value: c.id, label: c.fullName }))}
                  placeholder={loadingChildren ? t("Loading...") : t("Select a child")}
                  searchPlaceholder={t("Search children...")}
                  disabled={loadingChildren}
                />
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
                <Label>{t("Rate (per month)")}</Label>
                <Input
                  type="number"
                  min={0}
                  step="0.01"
                  value={formState.rate}
                  onChange={(e) => setFormState({ ...formState, rate: e.target.value })}
                  placeholder={t("Leave empty to use the standard fee")}
                />
              </div>

              <div>
                <Label>{t("Promo Code")}</Label>
                <Input
                  value={formState.promoCode}
                  onChange={(e) => setFormState({ ...formState, promoCode: e.target.value })}
                  placeholder={t("Promo code (optional)")}
                />
              </div>

              <div className="flex items-center justify-between p-4 rounded-lg bg-primary/5 border border-primary/10">
                <span className="text-sm text-muted-foreground">{t("Total to pay")}</span>
                <span className="text-2xl font-bold text-primary">{total.toFixed(2)}</span>
              </div>

              {quote && (
                <div className="rounded-lg border p-3 text-sm space-y-1">
                  <div className="font-semibold">{t("Price quote")}</div>
                  {typeof quote === "object" ? (
                    Object.entries(quote)
                      .filter(([, v]) => v !== null && v !== undefined && typeof v !== "object")
                      .map(([k, v]) => (
                        <div key={k} className="flex justify-between">
                          <span className="text-muted-foreground">{k}</span>
                          <span>{String(v)}</span>
                        </div>
                      ))
                  ) : (
                    <div>{String(quote)}</div>
                  )}
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <Button variant="outline" onClick={handleQuote} disabled={quoting} size="lg">
                  {quoting ? t("Loading...") : t("Get Quote")}
                </Button>
                <Button onClick={handleSubmit} disabled={isSubmitting} size="lg">
                  {isSubmitting ? t("Processing...") : t("Record Payment")}
                </Button>
              </div>
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

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>{t("Payment History")}</CardTitle>
              <CardDescription>{t("View all payments recorded for a specific child")}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <SearchableSelect
                  value={historyChildId}
                  onChange={setHistoryChildId}
                  options={children.map((c) => ({ value: c.id, label: c.fullName }))}
                  placeholder={t("Select a child")}
                  searchPlaceholder={t("Search children...")}
                  className="flex-1"
                />
                <Button variant="outline" onClick={handleLoadHistory} disabled={loadingHistory}>
                  {loadingHistory ? t("Loading...") : t("Load")}
                </Button>
              </div>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {history.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    {t("No history loaded yet.")}
                  </p>
                ) : (
                  history.map((p, i) => (
                    <div key={p.id || i} className="flex justify-between items-center text-sm border-b pb-2">
                      <div>
                        <div className="font-medium">{p.type}</div>
                        <div className="text-xs text-muted-foreground">
                          {p.periodStart} – {p.periodEnd}
                        </div>
                        {p.receiptNumber && (
                          <div className="text-xs text-muted-foreground">{t("Receipt")}: {p.receiptNumber}</div>
                        )}
                        {p.promoCode && (
                          <div className="text-xs text-muted-foreground">
                            {t("Promo Code")}: {p.promoCode} {p.discountAmount ? `(-${p.discountAmount})` : ""}
                          </div>
                        )}
                      </div>
                      <div className="text-right">
                        <div className="font-semibold">{p.amount?.toFixed?.(2) ?? p.amount}</div>
                        <Badge variant="outline">{p.status}</Badge>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t("Waive Certificate Fee")}</CardTitle>
              <CardDescription>{t("Waive the certificate fee for a child with a documented reason")}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>{t("Child")} *</Label>
                <SearchableSelect
                  value={waiveChildId}
                  onChange={setWaiveChildId}
                  options={children.map((c) => ({ value: c.id, label: c.fullName }))}
                  placeholder={t("Select a child")}
                  searchPlaceholder={t("Search children...")}
                />
              </div>
              <div>
                <Label>{t("Certificate Type")} *</Label>
                <Select value={waiveType} onValueChange={(v) => setWaiveType(v as CertificateFeeKind)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CERTIFICATE_FEE_KINDS.map((k) => (
                      <SelectItem key={k} value={k}>
                        {t(`CERTIFICATE_${k}`)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>{t("Reason")} *</Label>
                <Input value={waiveReason} onChange={(e) => setWaiveReason(e.target.value)} />
              </div>
              <Button variant="outline" className="w-full" onClick={handleWaive} disabled={isWaiving}>
                {isWaiving ? t("Waiving...") : t("Waive Fee")}
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>{t("Pay Certificate Fee")}</CardTitle>
              <CardDescription>{t("Collect the fee for a certificate before it is issued")}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>{t("Child")} *</Label>
                <SearchableSelect
                  value={certFee.childId}
                  onChange={(v) => setCertFee({ ...certFee, childId: v })}
                  options={children.map((c) => ({ value: c.id, label: c.fullName }))}
                  placeholder={t("Select a child")}
                  searchPlaceholder={t("Search children...")}
                />
              </div>
              <div>
                <Label>{t("Certificate Type")} *</Label>
                <Select
                  value={certFee.certificateType}
                  onValueChange={(v) => setCertFee({ ...certFee, certificateType: v as CertificateFeeKind })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CERTIFICATE_FEE_KINDS.map((k) => (
                      <SelectItem key={k} value={k}>
                        {t(`CERTIFICATE_${k}`)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>{t("Custom amount")}</Label>
                  <Input
                    type="number"
                    min={0}
                    step="0.01"
                    value={certFee.customRate}
                    onChange={(e) => setCertFee({ ...certFee, customRate: e.target.value })}
                    placeholder={t("Standard fee")}
                  />
                </div>
                <div>
                  <Label>{t("Promo Code")}</Label>
                  <Input value={certFee.promoCode} onChange={(e) => setCertFee({ ...certFee, promoCode: e.target.value })} />
                </div>
              </div>
              {certFee.customRate && (
                <div>
                  <Label>{t("Reason for custom amount")}</Label>
                  <Input value={certFee.customReason} onChange={(e) => setCertFee({ ...certFee, customReason: e.target.value })} />
                </div>
              )}
              {certQuote && typeof certQuote === "object" && (
                <div className="rounded-lg border p-3 text-sm space-y-1">
                  <div className="font-semibold">{t("Price quote")}</div>
                  {Object.entries(certQuote)
                    .filter(([, v]) => v !== null && v !== undefined && typeof v !== "object")
                    .map(([k, v]) => (
                      <div key={k} className="flex justify-between">
                        <span className="text-muted-foreground">{k}</span>
                        <span>{String(v)}</span>
                      </div>
                    ))}
                </div>
              )}
              {canIssue !== null && (
                <Alert variant={canIssue ? "default" : "destructive"}>
                  {canIssue ? <CheckCircle className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
                  <AlertDescription>
                    {canIssue ? t("This certificate can be issued.") : t("The certificate fee has not been settled yet.")}
                  </AlertDescription>
                </Alert>
              )}
              <div className="grid grid-cols-2 gap-3">
                <Button variant="outline" onClick={handleCertQuote} disabled={certBusy}>
                  {t("Get Quote")}
                </Button>
                <Button onClick={handlePayCertificate} disabled={certBusy}>
                  {certBusy ? t("Processing...") : t("Pay Fee")}
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t("Find a Receipt")}</CardTitle>
              <CardDescription>{t("Look up a payment by its receipt number")}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input value={receiptNo} onChange={(e) => setReceiptNo(e.target.value)} placeholder={t("Receipt number")} />
                <Button variant="outline" onClick={handleReceipt}>
                  {t("Search")}
                </Button>
              </div>
              {receipt && typeof receipt === "object" && (
                <div className="rounded-lg border p-3 text-sm space-y-1">
                  {Object.entries(receipt)
                    .filter(([, v]) => v !== null && v !== undefined && typeof v !== "object")
                    .map(([k, v]) => (
                      <div key={k} className="flex justify-between gap-4">
                        <span className="text-muted-foreground">{k}</span>
                        <span className="text-right break-all">{String(v)}</span>
                      </div>
                    ))}
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
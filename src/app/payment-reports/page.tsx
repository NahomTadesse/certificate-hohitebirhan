"use client";

import { useState } from "react";
import { toast } from "sonner";
import { FileBarChart } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import DashboardLayout from "../dashboard/layout";
import { fetchPaymentsReport, Payment, PaymentReportType } from "@/services/paymentService";
import { useTranslation } from "react-i18next";

export default function PaymentReportsPage() {
  const { t } = useTranslation();
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
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <FileBarChart className="h-7 w-7" /> {t("Payment Reports")}
          </h1>
          <p className="text-muted-foreground">{t("Generate a report of payments within a date range")}</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{t("Payments Report")}</CardTitle>
            <CardDescription>{t("Choose a type and date range")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div>
                <Label>{t("Type")}</Label>
                <Select value={reportType} onValueChange={(v) => setReportType(v as PaymentReportType)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MEMBERSHIP">{t("Membership")}</SelectItem>
                    <SelectItem value="CERTIFICATE">{t("Certificate")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>{t("Start Date")}</Label>
                <Input type="date" value={reportStart} onChange={(e) => setReportStart(e.target.value)} />
              </div>
              <div>
                <Label>{t("End Date")}</Label>
                <Input type="date" value={reportEnd} onChange={(e) => setReportEnd(e.target.value)} />
              </div>
              <div className="flex items-end">
                <Button className="w-full" onClick={handleLoadReport} disabled={loadingReport}>
                  {loadingReport ? t("Loading...") : t("Run Report")}
                </Button>
              </div>
            </div>

            <div className="space-y-2 max-h-[28rem] overflow-y-auto">
              {report.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  {t("Run a report to see results here.")}
                </p>
              ) : (
                <>
                  <div className="flex justify-between text-sm font-semibold border-b pb-2">
                    <span>{t("Total")}</span>
                    <span>{report.reduce((sum, p) => sum + (p.amount || 0), 0).toFixed(2)}</span>
                  </div>
                  {report.map((p, i) => (
                    <div key={p.id || i} className="flex justify-between items-center text-sm border-b pb-2">
                      <div>
                        <div className="font-medium">{p.childName || p.childId}</div>
                        <div className="text-xs text-muted-foreground">
                          {p.periodStart} – {p.periodEnd}
                        </div>
                        {p.receiptNumber && (
                          <div className="text-xs text-muted-foreground">{t("Receipt")}: {p.receiptNumber}</div>
                        )}
                      </div>
                      <div className="text-right">
                        <div className="font-semibold">{p.amount?.toFixed?.(2) ?? p.amount}</div>
                        <Badge variant="outline">{p.status}</Badge>
                      </div>
                    </div>
                  ))}
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}

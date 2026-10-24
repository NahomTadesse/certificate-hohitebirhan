"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { CalendarClock, Plus, RefreshCw } from "lucide-react";
import { useTranslation } from "react-i18next";

import DashboardLayout from "../dashboard/layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import SearchableSelect from "@/components/SearchableSelect";
import PhoneInput from "@/components/PhoneInput";
import {
  Appointment,
  fetchMyAppointments,
  fetchAppointmentsForFather,
  fetchPendingAppointmentsForFather,
  requestAppointment,
  confirmAppointment,
  declineAppointment,
  completeAppointment,
  proposeNewAppointmentTime,
  acceptProposedAppointmentTime,
  cancelAppointment,
} from "@/services/appointmentService";
import { toLocalTime, fromLocalTime } from "@/services/weddingBookingService";
import { fetchChildrenForDropdown, ChildDropdownOption } from "@/services/childrenService";
import { fetchFathersForDropdown } from "@/services/fatherService";
import { getCurrentUser } from "@/services/authService";

type Tab = "pending" | "forFather" | "mine";
type Dlg = { kind: "decline" | "propose" | "complete"; appt: Appointment } | null;

const statusColor = (s?: string) => {
  switch ((s || "").toUpperCase()) {
    case "CONFIRMED":
      return "bg-green-100 text-green-800";
    case "COMPLETED":
      return "bg-blue-100 text-blue-800";
    case "DECLINED":
    case "CANCELLED":
      return "bg-red-100 text-red-800";
    case "RESCHEDULE_PROPOSED":
    case "PROPOSED":
      return "bg-purple-100 text-purple-800";
    default:
      return "bg-yellow-100 text-yellow-800";
  }
};

export default function AppointmentsPage() {
  const { t } = useTranslation();
  const [userId, setUserId] = useState("");
  const [tab, setTab] = useState<Tab>("pending");
  const [items, setItems] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(false);
  const [children, setChildren] = useState<ChildDropdownOption[]>([]);
  const [fathers, setFathers] = useState<{ id: string; fullName: string; churchName?: string }[]>([]);

  const [reqOpen, setReqOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [req, setReq] = useState({ fatherId: "", childId: "", reason: "", requestedDate: "", requestedTime: "", contactPhone: "" });

  const [dlg, setDlg] = useState<Dlg>(null);
  const [dlgVals, setDlgVals] = useState({ reason: "", newDate: "", newTime: "", note: "" });

  useEffect(() => {
    const u = getCurrentUser();
    setUserId(u?.userId ? String(u.userId) : "");
    fetchChildrenForDropdown().then(setChildren).catch(() => {});
    fetchFathersForDropdown().then(setFathers).catch(() => {});
  }, []);

  const load = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const page =
        tab === "pending"
          ? await fetchPendingAppointmentsForFather(userId)
          : tab === "forFather"
          ? await fetchAppointmentsForFather(userId)
          : await fetchMyAppointments(userId);
      setItems(page.content || []);
    } catch (err: any) {
      toast.error(err.message || t("Failed to load appointments"));
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [tab, userId, t]);

  useEffect(() => {
    load();
  }, [load]);

  const run = async (fn: () => Promise<any>, ok: string) => {
    try {
      await fn();
      toast.success(ok);
      setDlg(null);
      setDlgVals({ reason: "", newDate: "", newTime: "", note: "" });
      await load();
    } catch (err: any) {
      toast.error(err.message || t("Operation failed"));
    }
  };

  const handleRequest = async () => {
    if (!userId) return;
    if (!req.fatherId || !req.requestedDate || !req.requestedTime) {
      toast.error(t("Father, date and time are required"));
      return;
    }
    setSaving(true);
    try {
      await requestAppointment(userId, {
        fatherId: req.fatherId,
        childId: req.childId || undefined,
        reason: req.reason || undefined,
        requestedDate: req.requestedDate,
        requestedTime: toLocalTime(req.requestedTime),
        contactPhone: req.contactPhone || undefined,
      });
      toast.success(t("Appointment requested"));
      setReqOpen(false);
      setReq({ fatherId: "", childId: "", reason: "", requestedDate: "", requestedTime: "", contactPhone: "" });
      setTab("mine");
    } catch (err: any) {
      toast.error(err.message || t("Operation failed"));
    } finally {
      setSaving(false);
    }
  };

  const submitDialog = () => {
    if (!dlg?.appt.id) return;
    const id = dlg.appt.id;
    if (dlg.kind === "decline") {
      if (!dlgVals.reason.trim()) return toast.error(t("A reason is required"));
      run(() => declineAppointment(id, userId, dlgVals.reason.trim()), t("Appointment declined"));
    } else if (dlg.kind === "propose") {
      if (!dlgVals.newDate || !dlgVals.newTime) return toast.error(t("Select a new date and time"));
      run(
        () => proposeNewAppointmentTime(id, userId, dlgVals.newDate, `${dlgVals.newDate}T${dlgVals.newTime}:00`, dlgVals.note || undefined),
        t("New time proposed")
      );
    } else {
      run(() => completeAppointment(id, userId), t("Appointment completed"));
    }
  };

  const nameOfChild = (a: Appointment) => a.childName || children.find((c) => c.id === a.childId)?.fullName || "—";
  const nameOfFather = (a: Appointment) => a.fatherName || fathers.find((f) => f.id === a.fatherId)?.fullName || "—";

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <CalendarClock className="h-8 w-8 text-primary" /> {t("Appointments")}
            </h1>
            <p className="text-muted-foreground">{t("Appointment requests between members and their fathers")}</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="icon" onClick={load} disabled={loading}><RefreshCw className="h-4 w-4" /></Button>
            <Button onClick={() => setReqOpen(true)}><Plus className="h-4 w-4 mr-2" />{t("Request Appointment")}</Button>
          </div>
        </div>

        <Tabs value={tab} onValueChange={(v) => setTab(v as Tab)}>
          <TabsList>
            <TabsTrigger value="pending">{t("Pending for me (as father)")}</TabsTrigger>
            <TabsTrigger value="forFather">{t("All for me (as father)")}</TabsTrigger>
            <TabsTrigger value="mine">{t("Requested by me")}</TabsTrigger>
          </TabsList>
        </Tabs>

        <Card>
          <CardContent className="pt-6">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("Date & Time")}</TableHead>
                  <TableHead>{t("Child")}</TableHead>
                  <TableHead>{t("Father")}</TableHead>
                  <TableHead>{t("Reason")}</TableHead>
                  <TableHead>{t("Status")}</TableHead>
                  <TableHead className="text-right">{t("Actions")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading && <TableRow><TableCell colSpan={6} className="text-center py-6 text-muted-foreground">{t("Loading...")}</TableCell></TableRow>}
                {!loading && items.length === 0 && <TableRow><TableCell colSpan={6} className="text-center py-6 text-muted-foreground">{t("No appointments")}</TableCell></TableRow>}
                {items.map((a, i) => {
                  const status = (a.status || "PENDING").toUpperCase();
                  const asFather = tab !== "mine";
                  return (
                    <TableRow key={a.id || i}>
                      <TableCell>
                        <div className="font-medium">{a.requestedDate}</div>
                        <div className="text-xs text-muted-foreground">{fromLocalTime(a.requestedTime)}</div>
                        {a.proposedDate && <div className="text-xs text-purple-700">{t("Proposed")}: {a.proposedDate} {a.proposedTime ? String(a.proposedTime).slice(11, 16) : ""}</div>}
                      </TableCell>
                      <TableCell>{nameOfChild(a)}</TableCell>
                      <TableCell>{nameOfFather(a)}</TableCell>
                      <TableCell className="text-sm max-w-xs">{a.reason || "—"}{a.declineReason && <div className="text-xs text-red-600">{a.declineReason}</div>}</TableCell>
                      <TableCell><Badge className={statusColor(status)}>{t(status)}</Badge></TableCell>
                      <TableCell className="text-right whitespace-nowrap">
                        {asFather && status === "PENDING" && a.id && (
                          <>
                            <Button size="sm" variant="outline" className="mr-1" onClick={() => run(() => confirmAppointment(a.id!, userId), t("Appointment confirmed"))}>{t("Confirm")}</Button>
                            <Button size="sm" variant="outline" className="mr-1" onClick={() => setDlg({ kind: "propose", appt: a })}>{t("Propose new time")}</Button>
                            <Button size="sm" variant="ghost" className="text-red-600" onClick={() => setDlg({ kind: "decline", appt: a })}>{t("Decline")}</Button>
                          </>
                        )}
                        {asFather && status === "CONFIRMED" && (
                          <Button size="sm" variant="outline" onClick={() => setDlg({ kind: "complete", appt: a })}>{t("Complete")}</Button>
                        )}
                        {!asFather && a.id && (status === "PROPOSED" || status === "RESCHEDULE_PROPOSED" || a.proposedDate) && status !== "CONFIRMED" && (
                          <Button size="sm" variant="outline" className="mr-1" onClick={() => run(() => acceptProposedAppointmentTime(a.id!, userId), t("New time accepted"))}>{t("Accept new time")}</Button>
                        )}
                        {!asFather && a.id && ["PENDING", "CONFIRMED", "PROPOSED", "RESCHEDULE_PROPOSED"].includes(status) && (
                          <Button size="sm" variant="ghost" className="text-red-600" onClick={() => run(() => cancelAppointment(a.id!, userId), t("Appointment cancelled"))}>{t("Cancel")}</Button>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Dialog open={reqOpen} onOpenChange={setReqOpen}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader><DialogTitle>{t("Request Appointment")}</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div>
                <Label>{t("Father")} *</Label>
                <SearchableSelect value={req.fatherId} onChange={(v) => setReq({ ...req, fatherId: v })}
                  options={fathers.map((f) => ({ value: f.id, label: f.fullName + (f.churchName ? ` — ${f.churchName}` : "") }))}
                  placeholder={t("Select a priest")} searchPlaceholder={t("Search priests...")} />
              </div>
              <div>
                <Label>{t("Child")}</Label>
                <SearchableSelect value={req.childId} onChange={(v) => setReq({ ...req, childId: v })}
                  options={children.map((c) => ({ value: c.id, label: c.fullName }))}
                  placeholder={t("Select a child")} searchPlaceholder={t("Search children...")} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>{t("Date")} *</Label><Input type="date" value={req.requestedDate} onChange={(e) => setReq({ ...req, requestedDate: e.target.value })} /></div>
                <div><Label>{t("Time")} *</Label><Input type="time" value={req.requestedTime} onChange={(e) => setReq({ ...req, requestedTime: e.target.value })} /></div>
              </div>
              <PhoneInput className="space-y-1.5 [&>label]:mb-0" label={t("Contact Phone")} value={req.contactPhone} onChange={(v) => setReq({ ...req, contactPhone: v })} />
              <div><Label>{t("Reason")}</Label><Textarea rows={3} value={req.reason} onChange={(e) => setReq({ ...req, reason: e.target.value })} /></div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setReqOpen(false)} disabled={saving}>{t("Cancel")}</Button>
              <Button onClick={handleRequest} disabled={saving}>{saving ? t("Saving...") : t("Send Request")}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={!!dlg} onOpenChange={(o) => !o && setDlg(null)}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>
                {dlg?.kind === "decline" ? t("Decline appointment") : dlg?.kind === "propose" ? t("Propose a new time") : t("Complete appointment")}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              {dlg?.kind === "decline" && (
                <div><Label>{t("Reason")} *</Label><Textarea rows={3} value={dlgVals.reason} onChange={(e) => setDlgVals({ ...dlgVals, reason: e.target.value })} /></div>
              )}
              {dlg?.kind === "propose" && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div><Label>{t("New Date")} *</Label><Input type="date" value={dlgVals.newDate} onChange={(e) => setDlgVals({ ...dlgVals, newDate: e.target.value })} /></div>
                    <div><Label>{t("New Time")} *</Label><Input type="time" value={dlgVals.newTime} onChange={(e) => setDlgVals({ ...dlgVals, newTime: e.target.value })} /></div>
                  </div>
                  <div><Label>{t("Note")}</Label><Textarea rows={2} value={dlgVals.note} onChange={(e) => setDlgVals({ ...dlgVals, note: e.target.value })} /></div>
                </>
              )}
              {dlg?.kind === "complete" && <p className="text-sm text-muted-foreground">{t("Mark this appointment as completed?")}</p>}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDlg(null)}>{t("Close")}</Button>
              <Button onClick={submitDialog} variant={dlg?.kind === "decline" ? "destructive" : "default"}>{t("Confirm")}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}

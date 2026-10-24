"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { CalendarHeart, Plus, RefreshCw, CheckCircle, XCircle, Wallet } from "lucide-react";
import { useTranslation } from "react-i18next";

import DashboardLayout from "../dashboard/layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import SearchableSelect from "@/components/SearchableSelect";
import PhoneInput from "@/components/PhoneInput";
import {
  WeddingBooking,
  fetchWeddingBookings,
  createWeddingBooking,
  checkWeddingAvailability,
  payAndConfirmBooking,
  confirmBooking,
  confirmBookingWithoutPayment,
  completeBooking,
  cancelBooking,
  toLocalTime,
  fromLocalTime,
} from "@/services/weddingBookingService";
import { fetchChurchesForDropdown } from "@/services/churchService";
import { fetchChildrenForDropdown, ChildDropdownOption } from "@/services/childrenService";
import { fetchFathersForDropdown } from "@/services/fatherService";
import { fetchStandardFee } from "@/services/feeService";

const statusColor = (s?: string) => {
  switch ((s || "").toUpperCase()) {
    case "CONFIRMED":
      return "bg-green-100 text-green-800";
    case "COMPLETED":
      return "bg-blue-100 text-blue-800";
    case "CANCELLED":
      return "bg-red-100 text-red-800";
    default:
      return "bg-yellow-100 text-yellow-800";
  }
};

const monthStart = () => {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().slice(0, 10);
};
const monthEnd = () => {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth() + 2, 0).toISOString().slice(0, 10);
};

type ActionKind = "pay" | "confirmFree" | "cancel";

export default function WeddingBookingsPage() {
  const { t } = useTranslation();
  const [churches, setChurches] = useState<{ id: string; name: string }[]>([]);
  const [children, setChildren] = useState<ChildDropdownOption[]>([]);
  const [fathers, setFathers] = useState<{ id: string; fullName: string; churchName?: string }[]>([]);
  const [churchId, setChurchId] = useState("");
  const [from, setFrom] = useState(monthStart());
  const [to, setTo] = useState(monthEnd());
  const [bookings, setBookings] = useState<WeddingBooking[]>([]);
  const [loading, setLoading] = useState(false);

  // create
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [defaultFee, setDefaultFee] = useState<string>("");
  const [availability, setAvailability] = useState<{ ok: boolean; message: string } | null>(null);
  const [form, setForm] = useState({
    groomChildId: "",
    groomFullName: "",
    brideChildId: "",
    brideFullName: "",
    officiatingPriestId: "",
    bookingDate: "",
    bookingTime: "",
    contactPhone: "",
    notes: "",
    bookingFee: "",
  });

  // action dialog
  const [action, setAction] = useState<{ kind: ActionKind; booking: WeddingBooking } | null>(null);
  const [actionVals, setActionVals] = useState({ customAmount: "", promoCode: "", customReason: "", reason: "" });

  useEffect(() => {
    fetchChurchesForDropdown()
      .then((c) => {
        setChurches(c);
        if (c[0]) setChurchId((prev) => prev || c[0].id);
      })
      .catch(() => {});
    fetchChildrenForDropdown().then(setChildren).catch(() => {});
    fetchFathersForDropdown().then(setFathers).catch(() => {});
  }, []);

  const load = useCallback(async () => {
    if (!churchId) return;
    setLoading(true);
    try {
      setBookings(await fetchWeddingBookings(churchId, from, to));
    } catch (err: any) {
      toast.error(err.message || t("Failed to load bookings"));
    } finally {
      setLoading(false);
    }
  }, [churchId, from, to, t]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!open || !churchId) return;
    fetchStandardFee("WEDDING_BOOKING", 1, churchId)
      .then((r: any) => {
        const d = r?.data;
        setDefaultFee(d === undefined || d === null ? "" : String(typeof d === "object" ? d.amount ?? d.fee ?? "" : d));
      })
      .catch(() => setDefaultFee(""));
  }, [open, churchId]);

  const childName = (id: string) => children.find((c) => c.id === id)?.fullName || "";

  const checkAvailability = async () => {
    if (!churchId || !form.bookingDate || !form.bookingTime) {
      toast.error(t("Select church, date and time first"));
      return;
    }
    try {
      const res: any = await checkWeddingAvailability(churchId, form.bookingDate, form.bookingTime);
      const d = res?.data;
      const available = typeof d === "boolean" ? d : d?.available ?? res?.success !== false;
      setAvailability({ ok: Boolean(available), message: res?.message || (available ? t("This slot is available") : t("This slot is already booked")) });
    } catch (err: any) {
      setAvailability({ ok: false, message: err.message || t("Could not check availability") });
    }
  };

  const handleCreate = async () => {
    if (!churchId || !form.bookingDate || !form.bookingTime) {
      toast.error(t("Church, date and time are required"));
      return;
    }
    if (!(form.groomChildId || form.groomFullName) || !(form.brideChildId || form.brideFullName)) {
      toast.error(t("Groom and bride are required"));
      return;
    }
    setSaving(true);
    try {
      await createWeddingBooking({
        churchId,
        groomChildId: form.groomChildId || undefined,
        groomFullName: form.groomFullName || childName(form.groomChildId) || undefined,
        brideChildId: form.brideChildId || undefined,
        brideFullName: form.brideFullName || childName(form.brideChildId) || undefined,
        officiatingPriestId: form.officiatingPriestId || undefined,
        bookingDate: form.bookingDate,
        bookingTime: toLocalTime(form.bookingTime),
        contactPhone: form.contactPhone || undefined,
        notes: form.notes || undefined,
        bookingFee: form.bookingFee ? parseFloat(form.bookingFee) : undefined,
      });
      toast.success(t("Booking created"));
      setOpen(false);
      setAvailability(null);
      setForm({ groomChildId: "", groomFullName: "", brideChildId: "", brideFullName: "", officiatingPriestId: "", bookingDate: "", bookingTime: "", contactPhone: "", notes: "", bookingFee: "" });
      await load();
    } catch (err: any) {
      toast.error(err.message || t("Operation failed"));
    } finally {
      setSaving(false);
    }
  };

  const runSimple = async (fn: () => Promise<any>, ok: string) => {
    try {
      await fn();
      toast.success(ok);
      await load();
    } catch (err: any) {
      toast.error(err.message || t("Operation failed"));
    }
  };

  const runAction = async () => {
    if (!action?.booking.id) return;
    const id = action.booking.id;
    setSaving(true);
    try {
      if (action.kind === "pay") {
        await payAndConfirmBooking(id, {
          customAmount: actionVals.customAmount ? parseFloat(actionVals.customAmount) : undefined,
          promoCode: actionVals.promoCode || undefined,
          customReason: actionVals.customReason || undefined,
        });
        toast.success(t("Payment recorded and booking confirmed"));
      } else if (action.kind === "confirmFree") {
        if (!actionVals.reason.trim()) {
          toast.error(t("A reason is required"));
          setSaving(false);
          return;
        }
        await confirmBookingWithoutPayment(id, actionVals.reason.trim());
        toast.success(t("Booking confirmed"));
      } else {
        await cancelBooking(id, actionVals.reason || undefined);
        toast.success(t("Booking cancelled"));
      }
      setAction(null);
      setActionVals({ customAmount: "", promoCode: "", customReason: "", reason: "" });
      await load();
    } catch (err: any) {
      toast.error(err.message || t("Operation failed"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <CalendarHeart className="h-8 w-8 text-primary" /> {t("Wedding Bookings")}
            </h1>
            <p className="text-muted-foreground">{t("Reserve church dates for weddings, take payment and confirm")}</p>
          </div>
          <Button onClick={() => setOpen(true)} disabled={!churchId}>
            <Plus className="h-4 w-4 mr-2" /> {t("New Booking")}
          </Button>
        </div>

        <Card>
          <CardContent className="pt-6 grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
            <div>
              <Label>{t("Church")}</Label>
              <Select value={churchId} onValueChange={setChurchId}>
                <SelectTrigger><SelectValue placeholder={t("Select a church")} /></SelectTrigger>
                <SelectContent>{churches.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>{t("From")}</Label><Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} /></div>
            <div><Label>{t("To")}</Label><Input type="date" value={to} onChange={(e) => setTo(e.target.value)} /></div>
            <Button variant="outline" onClick={load} disabled={loading}><RefreshCw className="h-4 w-4 mr-2" />{t("Refresh")}</Button>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("Date & Time")}</TableHead>
                  <TableHead>{t("Groom")}</TableHead>
                  <TableHead>{t("Bride")}</TableHead>
                  <TableHead>{t("Priest")}</TableHead>
                  <TableHead>{t("Fee")}</TableHead>
                  <TableHead>{t("Status")}</TableHead>
                  <TableHead className="text-right">{t("Actions")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading && <TableRow><TableCell colSpan={7} className="text-center py-6 text-muted-foreground">{t("Loading...")}</TableCell></TableRow>}
                {!loading && bookings.length === 0 && <TableRow><TableCell colSpan={7} className="text-center py-6 text-muted-foreground">{t("No bookings in this period")}</TableCell></TableRow>}
                {bookings.map((b, i) => {
                  const status = (b.status || "PENDING").toUpperCase();
                  return (
                    <TableRow key={b.id || i}>
                      <TableCell>
                        <div className="font-medium">{b.bookingDate}</div>
                        <div className="text-xs text-muted-foreground">{fromLocalTime(b.bookingTime)}</div>
                      </TableCell>
                      <TableCell>{b.groomFullName || childName(b.groomChildId || "")}</TableCell>
                      <TableCell>{b.brideFullName || childName(b.brideChildId || "")}</TableCell>
                      <TableCell className="text-sm">{b.officiatingPriestName || fathers.find((f) => f.id === b.officiatingPriestId)?.fullName || "—"}</TableCell>
                      <TableCell className="text-sm">
                        {b.bookingFee ?? "—"}
                        {b.paymentStatus && <div className="text-xs text-muted-foreground">{b.paymentStatus}</div>}
                      </TableCell>
                      <TableCell><Badge className={statusColor(status)}>{t(status)}</Badge></TableCell>
                      <TableCell className="text-right whitespace-nowrap">
                        {status === "PENDING" && (
                          <>
                            <Button size="sm" variant="outline" className="mr-1" onClick={() => setAction({ kind: "pay", booking: b })}>
                              <Wallet className="h-3.5 w-3.5 mr-1" />{t("Pay & Confirm")}
                            </Button>
                            <Button size="sm" variant="outline" className="mr-1" onClick={() => b.id && runSimple(() => confirmBooking(b.id!), t("Booking confirmed"))}>
                              {t("Confirm")}
                            </Button>
                            <Button size="sm" variant="outline" className="mr-1" onClick={() => setAction({ kind: "confirmFree", booking: b })}>
                              {t("Confirm without payment")}
                            </Button>
                          </>
                        )}
                        {status === "CONFIRMED" && (
                          <Button size="sm" variant="outline" className="mr-1" onClick={() => b.id && runSimple(() => completeBooking(b.id!), t("Booking completed"))}>
                            <CheckCircle className="h-3.5 w-3.5 mr-1" />{t("Complete")}
                          </Button>
                        )}
                        {(status === "PENDING" || status === "CONFIRMED") && (
                          <Button size="sm" variant="ghost" className="text-red-600" onClick={() => setAction({ kind: "cancel", booking: b })}>
                            <XCircle className="h-3.5 w-3.5 mr-1" />{t("Cancel")}
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* New booking */}
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent className="sm:max-w-2xl max-h-[92vh] overflow-y-auto">
            <DialogHeader><DialogTitle>{t("New Wedding Booking")}</DialogTitle></DialogHeader>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label>{t("Groom")} *</Label>
                <SearchableSelect value={form.groomChildId} onChange={(v) => setForm({ ...form, groomChildId: v, groomFullName: "" })}
                  options={children.map((c) => ({ value: c.id, label: c.fullName }))} placeholder={t("Select a child")} searchPlaceholder={t("Search children...")} />
                <Input className="mt-2" placeholder={t("or type the groom's full name")} value={form.groomFullName} onChange={(e) => setForm({ ...form, groomFullName: e.target.value, groomChildId: "" })} />
              </div>
              <div>
                <Label>{t("Bride")} *</Label>
                <SearchableSelect value={form.brideChildId} onChange={(v) => setForm({ ...form, brideChildId: v, brideFullName: "" })}
                  options={children.map((c) => ({ value: c.id, label: c.fullName }))} placeholder={t("Select the bride")} searchPlaceholder={t("Search children...")} />
                <Input className="mt-2" placeholder={t("or type the bride's full name")} value={form.brideFullName} onChange={(e) => setForm({ ...form, brideFullName: e.target.value, brideChildId: "" })} />
              </div>
              <div><Label>{t("Date")} *</Label><Input type="date" value={form.bookingDate} onChange={(e) => { setForm({ ...form, bookingDate: e.target.value }); setAvailability(null); }} /></div>
              <div><Label>{t("Time")} *</Label><Input type="time" value={form.bookingTime} onChange={(e) => { setForm({ ...form, bookingTime: e.target.value }); setAvailability(null); }} /></div>
              <div className="sm:col-span-2 flex items-center gap-3">
                <Button type="button" variant="outline" size="sm" onClick={checkAvailability}>{t("Check availability")}</Button>
                {availability && (
                  <Alert variant={availability.ok ? "default" : "destructive"} className="py-2 flex-1">
                    <AlertDescription>{availability.message}</AlertDescription>
                  </Alert>
                )}
              </div>
              <div>
                <Label>{t("Officiating Priest")}</Label>
                <SearchableSelect value={form.officiatingPriestId} onChange={(v) => setForm({ ...form, officiatingPriestId: v })}
                  options={fathers.map((f) => ({ value: f.id, label: f.fullName + (f.churchName ? ` — ${f.churchName}` : "") }))}
                  placeholder={t("Select a priest")} searchPlaceholder={t("Search priests...")} />
              </div>
              <PhoneInput className="space-y-1.5 [&>label]:mb-0" label={t("Contact Phone")} value={form.contactPhone} onChange={(v) => setForm({ ...form, contactPhone: v })} />
              <div>
                <Label>{t("Booking Fee")}</Label>
                <Input type="number" min={0} value={form.bookingFee} onChange={(e) => setForm({ ...form, bookingFee: e.target.value })} placeholder={defaultFee ? `${t("Standard")}: ${defaultFee}` : ""} />
              </div>
            </div>
            <div><Label>{t("Notes")}</Label><Textarea rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)} disabled={saving}>{t("Cancel")}</Button>
              <Button onClick={handleCreate} disabled={saving}>{saving ? t("Saving...") : t("Create Booking")}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Pay / confirm w/o payment / cancel */}
        <Dialog open={!!action} onOpenChange={(o) => !o && setAction(null)}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>
                {action?.kind === "pay" ? t("Pay & Confirm") : action?.kind === "confirmFree" ? t("Confirm without payment") : t("Cancel booking")}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              {action?.kind === "pay" && (
                <>
                  <div><Label>{t("Custom amount (optional)")}</Label><Input type="number" min={0} value={actionVals.customAmount} onChange={(e) => setActionVals({ ...actionVals, customAmount: e.target.value })} /></div>
                  <div><Label>{t("Promo Code")}</Label><Input value={actionVals.promoCode} onChange={(e) => setActionVals({ ...actionVals, promoCode: e.target.value })} /></div>
                  <div><Label>{t("Reason for custom amount")}</Label><Input value={actionVals.customReason} onChange={(e) => setActionVals({ ...actionVals, customReason: e.target.value })} /></div>
                </>
              )}
              {action?.kind !== "pay" && (
                <div>
                  <Label>{t("Reason")}{action?.kind === "confirmFree" ? " *" : ""}</Label>
                  <Textarea rows={3} value={actionVals.reason} onChange={(e) => setActionVals({ ...actionVals, reason: e.target.value })} />
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setAction(null)} disabled={saving}>{t("Close")}</Button>
              <Button onClick={runAction} disabled={saving} variant={action?.kind === "cancel" ? "destructive" : "default"}>
                {saving ? t("Processing...") : t("Confirm")}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}

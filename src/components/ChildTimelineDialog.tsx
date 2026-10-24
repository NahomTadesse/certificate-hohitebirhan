"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Plus, Trash2, Eye, EyeOff } from "lucide-react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  ChildEvent,
  ChildEventType,
  CHILD_EVENT_TYPES,
  addChildEvent,
  fetchChildFullTimeline,
  deleteChildEvent,
} from "@/services/childEventService";
import { toLocalTime, fromLocalTime } from "@/services/weddingBookingService";
import { getCurrentUser } from "@/services/authService";

// Timeline of a child's events (swagger: child-event-controller). Shows the full timeline,
// including events hidden from the guardian, and lets staff add / delete events.
export default function ChildTimelineDialog({
  open,
  onClose,
  childId,
  childName,
}: {
  open: boolean;
  onClose: () => void;
  childId?: string;
  childName?: string;
}) {
  const { t } = useTranslation();
  const [events, setEvents] = useState<ChildEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [adding, setAdding] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    eventType: "FATHER_NOTE" as ChildEventType,
    title: "",
    description: "",
    eventDate: new Date().toISOString().slice(0, 10),
    eventTime: "",
    visibleToGuardian: true,
  });

  const load = useCallback(async () => {
    if (!childId) return;
    setLoading(true);
    try {
      setEvents((await fetchChildFullTimeline(childId)).content || []);
    } catch (err: any) {
      toast.error(err.message || t("Failed to load timeline"));
    } finally {
      setLoading(false);
    }
  }, [childId, t]);

  useEffect(() => {
    if (open) {
      setAdding(false);
      load();
    }
  }, [open, load]);

  const save = async () => {
    if (!childId) return;
    const user = getCurrentUser();
    if (!user?.userId) return toast.error(t("Session expired. Please log in again."));
    if (!form.title.trim()) return toast.error(t("Title is required"));
    setSaving(true);
    try {
      await addChildEvent(
        childId,
        String(user.userId),
        {
          childId,
          eventType: form.eventType,
          title: form.title.trim(),
          description: form.description || undefined,
          eventDate: form.eventDate || undefined,
          eventTime: toLocalTime(form.eventTime),
          visibleToGuardian: form.visibleToGuardian,
        },
        "ADMIN"
      );
      toast.success(t("Event added"));
      setAdding(false);
      setForm({ ...form, title: "", description: "", eventTime: "" });
      await load();
    } catch (err: any) {
      toast.error(err.message || t("Operation failed"));
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id?: string) => {
    if (!id) return;
    try {
      await deleteChildEvent(id);
      toast.success(t("Event deleted"));
      await load();
    } catch (err: any) {
      toast.error(err.message || t("Operation failed"));
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {t("Timeline")}
            {childName ? `: ${childName}` : ""}
          </DialogTitle>
        </DialogHeader>

        <div className="flex justify-end">
          <Button size="sm" variant="outline" onClick={() => setAdding((a) => !a)}>
            <Plus className="h-4 w-4 mr-1" /> {t("Add Event")}
          </Button>
        </div>

        {adding && (
          <div className="border rounded-md p-3 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>{t("Event Type")}</Label>
                <Select value={form.eventType} onValueChange={(v) => setForm({ ...form, eventType: v as ChildEventType })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CHILD_EVENT_TYPES.map((x) => <SelectItem key={x} value={x}>{t(x)}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>{t("Title")} *</Label>
                <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
              </div>
              <div>
                <Label>{t("Date")}</Label>
                <Input type="date" value={form.eventDate} onChange={(e) => setForm({ ...form, eventDate: e.target.value })} />
              </div>
              <div>
                <Label>{t("Time")}</Label>
                <Input type="time" value={form.eventTime} onChange={(e) => setForm({ ...form, eventTime: e.target.value })} />
              </div>
            </div>
            <div>
              <Label>{t("Description")}</Label>
              <Textarea rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>
            <label className="flex items-center gap-2 text-sm">
              <Checkbox checked={form.visibleToGuardian} onCheckedChange={(v) => setForm({ ...form, visibleToGuardian: Boolean(v) })} />
              {t("Visible to the guardian")}
            </label>
            <div className="flex justify-end gap-2">
              <Button size="sm" variant="outline" onClick={() => setAdding(false)} disabled={saving}>{t("Cancel")}</Button>
              <Button size="sm" onClick={save} disabled={saving}>{saving ? t("Saving...") : t("Save")}</Button>
            </div>
          </div>
        )}

        <div className="space-y-3">
          {loading && <p className="text-sm text-muted-foreground text-center py-4">{t("Loading...")}</p>}
          {!loading && events.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">{t("No events yet")}</p>}
          {events.map((e, i) => (
            <div key={e.id || i} className="border-l-2 border-primary pl-3 py-1 flex justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-medium text-sm">{e.title}</span>
                  {e.eventType && <Badge variant="outline">{t(e.eventType)}</Badge>}
                  {e.source && <Badge variant="outline">{e.source}</Badge>}
                  {e.visibleToGuardian === false ? <EyeOff className="h-3.5 w-3.5 text-muted-foreground" /> : <Eye className="h-3.5 w-3.5 text-muted-foreground" />}
                </div>
                <div className="text-xs text-muted-foreground">
                  {e.eventDate} {fromLocalTime(e.eventTime)}
                </div>
                {e.description && <p className="text-sm mt-1">{e.description}</p>}
              </div>
              {e.source !== "SYSTEM" && (
                <Button size="icon" variant="ghost" className="text-red-600 shrink-0" onClick={() => remove(e.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}

"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Package, Plus, RefreshCw, Search, Eye, Edit, UserPlus, Undo2, Power, AlertTriangle } from "lucide-react";
import { useTranslation } from "react-i18next";

import DashboardLayout from "../dashboard/layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import SearchableSelect from "@/components/SearchableSelect";
import {
  Resource,
  ResourcePayload,
  ResourceType,
  AcquisitionType,
  ResourceCondition,
  AssignmentType,
  RESOURCE_TYPES,
  ACQUISITION_TYPES,
  RESOURCE_CONDITIONS,
  searchResources,
  fetchOverdueResources,
  fetchResourceById,
  fetchResourceCategories,
  createResource,
  updateResource,
  deactivateResource,
  assignResource,
  returnResource,
  ResourceCategory,
} from "@/services/resourceService";
import { fetchChurchesForDropdown } from "@/services/churchService";
import { fetchFathersForDropdown } from "@/services/fatherService";

const NONE = "__none__";

const emptyForm = {
  name: "",
  type: "PHYSICAL_ITEM" as ResourceType,
  inventoryCode: "",
  category: "",
  description: "",
  yearOfOrigin: "",
  originLocation: "",
  historicalNotes: "",
  acquisitionType: "" as AcquisitionType | "",
  acquisitionDate: "",
  donorName: "",
  estimatedValue: "",
  condition: "GOOD" as ResourceCondition,
  conditionNotes: "",
  storageLocation: "",
  churchId: "",
};

const conditionColor: Record<string, string> = {
  EXCELLENT: "bg-green-100 text-green-800",
  GOOD: "bg-emerald-100 text-emerald-800",
  FAIR: "bg-yellow-100 text-yellow-800",
  DAMAGED: "bg-orange-100 text-orange-800",
  NEEDS_REPAIR: "bg-orange-100 text-orange-800",
  LOST: "bg-red-100 text-red-800",
};

export default function ResourcesPage() {
  const { t, i18n } = useTranslation();
  const [items, setItems] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [view, setView] = useState<"all" | "overdue">("all");

  const [name, setName] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [conditionFilter, setConditionFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [churchFilter, setChurchFilter] = useState("");
  const [activeFilter, setActiveFilter] = useState<"all" | "true" | "false">("true");

  const [churches, setChurches] = useState<{ id: string; name: string }[]>([]);
  const [fathers, setFathers] = useState<{ id: string; fullName: string; churchName?: string }[]>([]);
  const [categories, setCategories] = useState<ResourceCategory[]>([]);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Resource | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const [detail, setDetail] = useState<Resource | null>(null);

  const [assignTarget, setAssignTarget] = useState<Resource | null>(null);
  const [assign, setAssign] = useState({
    fatherId: "",
    assignedToDepartment: "",
    assignmentType: "PERMANENT" as AssignmentType,
    assignedDate: new Date().toISOString().slice(0, 10),
    expectedReturnDate: "",
    notes: "",
  });

  const [returnTarget, setReturnTarget] = useState<Resource | null>(null);
  const [returnNotes, setReturnNotes] = useState("");
  const [deactivateTarget, setDeactivateTarget] = useState<Resource | null>(null);

  const categoryLabel = (c: ResourceCategory) => (i18n.language === "am" && c.amharicLabel ? c.amharicLabel : c.value);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      if (view === "overdue") {
        const list = await fetchOverdueResources();
        setItems(list);
        setTotalPages(1);
      } else {
        const res = await searchResources(
          {
            name: name.trim() || undefined,
            type: (typeFilter as ResourceType) || undefined,
            condition: (conditionFilter as ResourceCondition) || undefined,
            category: categoryFilter || undefined,
            churchId: churchFilter || undefined,
            isActive: activeFilter === "all" ? undefined : activeFilter === "true",
          },
          page,
          10
        );
        setItems(res.content || []);
        setTotalPages(res.totalPages || 0);
      }
    } catch (err: any) {
      toast.error(err.message || t("Failed to load resources"));
    } finally {
      setLoading(false);
    }
  }, [view, name, typeFilter, conditionFilter, categoryFilter, churchFilter, activeFilter, page, t]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    fetchChurchesForDropdown().then(setChurches).catch(() => {});
    fetchFathersForDropdown().then(setFathers).catch(() => {});
    fetchResourceCategories().then(setCategories).catch(() => {});
  }, []);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setFormOpen(true);
  };

  const openEdit = async (r: Resource) => {
    let full = r;
    try {
      full = await fetchResourceById(r.id);
    } catch {
      /* fall back to the list row */
    }
    setEditing(full);
    setForm({
      name: full.name || "",
      type: (full.type as ResourceType) || "PHYSICAL_ITEM",
      inventoryCode: full.inventoryCode || "",
      category: full.category || "",
      description: full.description || "",
      yearOfOrigin: full.yearOfOrigin ? String(full.yearOfOrigin) : "",
      originLocation: full.originLocation || "",
      historicalNotes: full.historicalNotes || "",
      acquisitionType: (full.acquisitionType as AcquisitionType) || "",
      acquisitionDate: full.acquisitionDate || "",
      donorName: full.donorName || "",
      estimatedValue: full.estimatedValue !== undefined && full.estimatedValue !== null ? String(full.estimatedValue) : "",
      condition: (full.condition as ResourceCondition) || "GOOD",
      conditionNotes: full.conditionNotes || "",
      storageLocation: full.storageLocation || "",
      churchId: churches.find((c) => c.name === full.churchName)?.id || "",
    });
    setFormOpen(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      toast.error(t("Name is required"));
      return;
    }
    const payload: ResourcePayload = {
      name: form.name.trim(),
      type: form.type,
      inventoryCode: form.inventoryCode || undefined,
      category: form.category || undefined,
      description: form.description || undefined,
      yearOfOrigin: form.yearOfOrigin ? parseInt(form.yearOfOrigin, 10) : undefined,
      originLocation: form.originLocation || undefined,
      historicalNotes: form.historicalNotes || undefined,
      acquisitionType: (form.acquisitionType as AcquisitionType) || undefined,
      acquisitionDate: form.acquisitionDate || undefined,
      donorName: form.donorName || undefined,
      estimatedValue: form.estimatedValue ? parseFloat(form.estimatedValue) : undefined,
      condition: form.condition,
      conditionNotes: form.conditionNotes || undefined,
      storageLocation: form.storageLocation || undefined,
      churchId: form.churchId || undefined,
    };
    setSaving(true);
    try {
      if (editing) await updateResource(editing.id, payload);
      else await createResource(payload);
      toast.success(editing ? t("Resource updated") : t("Resource created"));
      setFormOpen(false);
      await load();
    } catch (err: any) {
      toast.error(err.message || t("Operation failed"));
    } finally {
      setSaving(false);
    }
  };

  const handleAssign = async () => {
    if (!assignTarget) return;
    if (!assign.fatherId && !assign.assignedToDepartment.trim()) {
      toast.error(t("Choose a father or enter a department"));
      return;
    }
    if (assign.assignmentType === "BORROWED" && !assign.expectedReturnDate) {
      toast.error(t("Expected return date is required for borrowed items"));
      return;
    }
    setSaving(true);
    try {
      await assignResource(assignTarget.id, {
        fatherId: assign.fatherId || undefined,
        assignedToDepartment: assign.assignedToDepartment || undefined,
        assignmentType: assign.assignmentType,
        assignedDate: assign.assignedDate,
        expectedReturnDate: assign.expectedReturnDate || undefined,
        notes: assign.notes || undefined,
      });
      toast.success(t("Resource assigned"));
      setAssignTarget(null);
      await load();
    } catch (err: any) {
      toast.error(err.message || t("Operation failed"));
    } finally {
      setSaving(false);
    }
  };

  const handleReturn = async () => {
    if (!returnTarget) return;
    setSaving(true);
    try {
      await returnResource(returnTarget.id, returnNotes || undefined);
      toast.success(t("Resource returned"));
      setReturnTarget(null);
      setReturnNotes("");
      await load();
    } catch (err: any) {
      toast.error(err.message || t("Operation failed"));
    } finally {
      setSaving(false);
    }
  };

  const handleDeactivate = async () => {
    if (!deactivateTarget) return;
    setSaving(true);
    try {
      await deactivateResource(deactivateTarget.id);
      toast.success(t("Resource deactivated"));
      setDeactivateTarget(null);
      await load();
    } catch (err: any) {
      toast.error(err.message || t("Operation failed"));
    } finally {
      setSaving(false);
    }
  };

  const openDetail = async (r: Resource) => {
    setDetail(r);
    try {
      setDetail(await fetchResourceById(r.id));
    } catch {
      /* keep list row */
    }
  };

  const set = (patch: Partial<typeof emptyForm>) => setForm((f) => ({ ...f, ...patch }));

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Package className="h-8 w-8 text-primary" /> {t("Church Resources")}
            </h1>
            <p className="text-muted-foreground">{t("Inventory of items, properties and historical artifacts, and who holds them")}</p>
          </div>
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4 mr-2" /> {t("Add Resource")}
          </Button>
        </div>

        <Tabs value={view} onValueChange={(v) => { setView(v as any); setPage(0); }}>
          <TabsList>
            <TabsTrigger value="all">{t("All Resources")}</TabsTrigger>
            <TabsTrigger value="overdue" className="gap-1">
              <AlertTriangle className="h-3.5 w-3.5" /> {t("Overdue Returns")}
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {view === "all" && (
          <Card>
            <CardContent className="pt-6 grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-3">
              <div className="relative lg:col-span-2">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input className="pl-9" placeholder={t("Search by name...")} value={name} onChange={(e) => { setName(e.target.value); setPage(0); }} />
              </div>
              <Select value={typeFilter || "all"} onValueChange={(v) => { setTypeFilter(v === "all" ? "" : v); setPage(0); }}>
                <SelectTrigger><SelectValue placeholder={t("Type")} /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("All types")}</SelectItem>
                  {RESOURCE_TYPES.map((x) => <SelectItem key={x} value={x}>{t(x)}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={conditionFilter || "all"} onValueChange={(v) => { setConditionFilter(v === "all" ? "" : v); setPage(0); }}>
                <SelectTrigger><SelectValue placeholder={t("Condition")} /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("All conditions")}</SelectItem>
                  {RESOURCE_CONDITIONS.map((x) => <SelectItem key={x} value={x}>{t(x)}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={categoryFilter || "all"} onValueChange={(v) => { setCategoryFilter(v === "all" ? "" : v); setPage(0); }}>
                <SelectTrigger><SelectValue placeholder={t("Category")} /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("All categories")}</SelectItem>
                  {categories.map((c) => <SelectItem key={c.value} value={c.value}>{categoryLabel(c)}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={churchFilter || "all"} onValueChange={(v) => { setChurchFilter(v === "all" ? "" : v); setPage(0); }}>
                <SelectTrigger><SelectValue placeholder={t("Church")} /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("All churches")}</SelectItem>
                  {churches.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={activeFilter} onValueChange={(v) => { setActiveFilter(v as any); setPage(0); }}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="true">{t("Active")}</SelectItem>
                  <SelectItem value="false">{t("Inactive")}</SelectItem>
                  <SelectItem value="all">{t("All")}</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" onClick={load} disabled={loading}>
                <RefreshCw className="h-4 w-4 mr-2" /> {t("Refresh")}
              </Button>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardContent className="pt-6">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("Resource")}</TableHead>
                  <TableHead>{t("Type")}</TableHead>
                  <TableHead>{t("Condition")}</TableHead>
                  <TableHead>{t("Church")}</TableHead>
                  <TableHead>{t("Assigned To")}</TableHead>
                  <TableHead className="text-right">{t("Actions")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading && (
                  <TableRow><TableCell colSpan={6} className="text-center py-6 text-muted-foreground">{t("Loading...")}</TableCell></TableRow>
                )}
                {!loading && items.length === 0 && (
                  <TableRow><TableCell colSpan={6} className="text-center py-6 text-muted-foreground">{t("No resources found")}</TableCell></TableRow>
                )}
                {items.map((r) => {
                  const a = r.currentAssignment;
                  return (
                    <TableRow key={r.id}>
                      <TableCell>
                        <div className="font-medium">{r.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {r.inventoryCode || "—"} {r.category ? `· ${r.category}` : ""}
                        </div>
                      </TableCell>
                      <TableCell><Badge variant="outline">{t(r.type as string)}</Badge></TableCell>
                      <TableCell>
                        {r.condition && <Badge className={conditionColor[r.condition] || ""}>{t(r.condition)}</Badge>}
                      </TableCell>
                      <TableCell className="text-sm">{r.churchName || "—"}</TableCell>
                      <TableCell className="text-sm">
                        {a ? (
                          <div>
                            <div>{a.assignedToFatherName || a.assignedToDepartment}</div>
                            <div className="text-xs text-muted-foreground">
                              {t(a.assignmentType as string)}
                              {a.expectedReturnDate ? ` · ${t("due")} ${a.expectedReturnDate}` : ""}
                            </div>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">{t("Unassigned")}</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right whitespace-nowrap">
                        <Button size="icon" variant="ghost" title={t("View")} onClick={() => openDetail(r)}><Eye className="h-4 w-4" /></Button>
                        <Button size="icon" variant="ghost" title={t("Edit")} onClick={() => openEdit(r)}><Edit className="h-4 w-4" /></Button>
                        {a && !a.returnedDate ? (
                          <Button size="icon" variant="ghost" title={t("Return")} onClick={() => setReturnTarget(r)}><Undo2 className="h-4 w-4" /></Button>
                        ) : (
                          <Button size="icon" variant="ghost" title={t("Assign")} onClick={() => setAssignTarget(r)}><UserPlus className="h-4 w-4" /></Button>
                        )}
                        {r.active !== false && (
                          <Button size="icon" variant="ghost" className="text-red-600" title={t("Deactivate")} onClick={() => setDeactivateTarget(r)}>
                            <Power className="h-4 w-4" />
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
            {view === "all" && totalPages > 1 && (
              <div className="flex items-center justify-end gap-2 pt-4">
                <Button size="sm" variant="outline" disabled={page === 0} onClick={() => setPage((p) => p - 1)}>{t("Previous")}</Button>
                <span className="text-sm text-muted-foreground">{page + 1} / {totalPages}</span>
                <Button size="sm" variant="outline" disabled={page + 1 >= totalPages} onClick={() => setPage((p) => p + 1)}>{t("Next")}</Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Create / edit */}
        <Dialog open={formOpen} onOpenChange={setFormOpen}>
          <DialogContent className="sm:max-w-3xl max-h-[92vh] overflow-y-auto">
            <DialogHeader><DialogTitle>{editing ? t("Edit Resource") : t("Add Resource")}</DialogTitle></DialogHeader>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div><Label>{t("Name")} *</Label><Input value={form.name} onChange={(e) => set({ name: e.target.value })} /></div>
              <div>
                <Label>{t("Type")} *</Label>
                <Select value={form.type} onValueChange={(v) => set({ type: v as ResourceType })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{RESOURCE_TYPES.map((x) => <SelectItem key={x} value={x}>{t(x)}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>{t("Inventory Code")}</Label><Input value={form.inventoryCode} onChange={(e) => set({ inventoryCode: e.target.value })} /></div>
              <div>
                <Label>{t("Category")}</Label>
                <Select value={form.category || NONE} onValueChange={(v) => set({ category: v === NONE ? "" : v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NONE}>{t("None")}</SelectItem>
                    {categories.map((c) => <SelectItem key={c.value} value={c.value}>{categoryLabel(c)}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>{t("Church")}</Label>
                <SearchableSelect
                  value={form.churchId}
                  onChange={(v) => set({ churchId: v })}
                  options={churches.map((c) => ({ value: c.id, label: c.name }))}
                  placeholder={t("Select a church")}
                  searchPlaceholder={t("Search churches...")}
                />
              </div>
              <div><Label>{t("Storage Location")}</Label><Input value={form.storageLocation} onChange={(e) => set({ storageLocation: e.target.value })} /></div>
              <div>
                <Label>{t("Condition")}</Label>
                <Select value={form.condition} onValueChange={(v) => set({ condition: v as ResourceCondition })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{RESOURCE_CONDITIONS.map((x) => <SelectItem key={x} value={x}>{t(x)}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>{t("Condition Notes")}</Label><Input value={form.conditionNotes} onChange={(e) => set({ conditionNotes: e.target.value })} /></div>
              <div>
                <Label>{t("Acquisition Type")}</Label>
                <Select value={form.acquisitionType || NONE} onValueChange={(v) => set({ acquisitionType: v === NONE ? "" : (v as AcquisitionType) })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NONE}>{t("None")}</SelectItem>
                    {ACQUISITION_TYPES.map((x) => <SelectItem key={x} value={x}>{t(x)}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div><Label>{t("Acquisition Date")}</Label><Input type="date" value={form.acquisitionDate} onChange={(e) => set({ acquisitionDate: e.target.value })} /></div>
              <div><Label>{t("Donor Name")}</Label><Input value={form.donorName} onChange={(e) => set({ donorName: e.target.value })} /></div>
              <div><Label>{t("Estimated Value")}</Label><Input type="number" min={0} value={form.estimatedValue} onChange={(e) => set({ estimatedValue: e.target.value })} /></div>
              <div><Label>{t("Year of Origin")}</Label><Input type="number" value={form.yearOfOrigin} onChange={(e) => set({ yearOfOrigin: e.target.value })} /></div>
              <div><Label>{t("Origin Location")}</Label><Input value={form.originLocation} onChange={(e) => set({ originLocation: e.target.value })} /></div>
            </div>
            <div><Label>{t("Description")}</Label><Textarea rows={2} value={form.description} onChange={(e) => set({ description: e.target.value })} /></div>
            {form.type === "HISTORICAL" && (
              <div><Label>{t("Historical Notes")}</Label><Textarea rows={3} value={form.historicalNotes} onChange={(e) => set({ historicalNotes: e.target.value })} /></div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setFormOpen(false)} disabled={saving}>{t("Cancel")}</Button>
              <Button onClick={handleSave} disabled={saving}>{saving ? t("Saving...") : t("Save")}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Assign */}
        <Dialog open={!!assignTarget} onOpenChange={(o) => !o && setAssignTarget(null)}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader><DialogTitle>{t("Assign Resource")}: {assignTarget?.name}</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div>
                <Label>{t("Father")}</Label>
                <SearchableSelect
                  value={assign.fatherId}
                  onChange={(v) => setAssign({ ...assign, fatherId: v })}
                  options={fathers.map((f) => ({ value: f.id, label: f.fullName + (f.churchName ? ` — ${f.churchName}` : "") }))}
                  placeholder={t("Select a priest")}
                  searchPlaceholder={t("Search priests...")}
                />
              </div>
              <div><Label>{t("Department")}</Label><Input value={assign.assignedToDepartment} onChange={(e) => setAssign({ ...assign, assignedToDepartment: e.target.value })} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>{t("Assignment Type")} *</Label>
                  <Select value={assign.assignmentType} onValueChange={(v) => setAssign({ ...assign, assignmentType: v as AssignmentType })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PERMANENT">{t("PERMANENT")}</SelectItem>
                      <SelectItem value="BORROWED">{t("BORROWED")}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div><Label>{t("Assigned Date")} *</Label><Input type="date" value={assign.assignedDate} onChange={(e) => setAssign({ ...assign, assignedDate: e.target.value })} /></div>
              </div>
              {assign.assignmentType === "BORROWED" && (
                <div><Label>{t("Expected Return Date")} *</Label><Input type="date" value={assign.expectedReturnDate} onChange={(e) => setAssign({ ...assign, expectedReturnDate: e.target.value })} /></div>
              )}
              <div><Label>{t("Notes")}</Label><Textarea rows={2} value={assign.notes} onChange={(e) => setAssign({ ...assign, notes: e.target.value })} /></div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setAssignTarget(null)} disabled={saving}>{t("Cancel")}</Button>
              <Button onClick={handleAssign} disabled={saving}>{saving ? t("Saving...") : t("Assign")}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Return */}
        <Dialog open={!!returnTarget} onOpenChange={(o) => !o && setReturnTarget(null)}>
          <DialogContent>
            <DialogHeader><DialogTitle>{t("Return Resource")}: {returnTarget?.name}</DialogTitle></DialogHeader>
            <div><Label>{t("Notes")}</Label><Textarea rows={3} value={returnNotes} onChange={(e) => setReturnNotes(e.target.value)} /></div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setReturnTarget(null)} disabled={saving}>{t("Cancel")}</Button>
              <Button onClick={handleReturn} disabled={saving}>{saving ? t("Saving...") : t("Mark as Returned")}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Deactivate */}
        <Dialog open={!!deactivateTarget} onOpenChange={(o) => !o && setDeactivateTarget(null)}>
          <DialogContent>
            <DialogHeader><DialogTitle>{t("Deactivate Resource?")}</DialogTitle></DialogHeader>
            <p className="text-sm text-muted-foreground">{deactivateTarget?.name}</p>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDeactivateTarget(null)} disabled={saving}>{t("Cancel")}</Button>
              <Button variant="destructive" onClick={handleDeactivate} disabled={saving}>{t("Deactivate")}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Details */}
        <Dialog open={!!detail} onOpenChange={(o) => !o && setDetail(null)}>
          <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>{detail?.name}</DialogTitle></DialogHeader>
            {detail && (
              <div className="space-y-4 text-sm">
                <div className="grid grid-cols-2 gap-x-6 gap-y-2">
                  {([
                    ["Type", detail.type && t(detail.type as string)],
                    ["Condition", detail.condition && t(detail.condition as string)],
                    ["Inventory Code", detail.inventoryCode],
                    ["Category", detail.category],
                    ["Church", detail.churchName],
                    ["Storage Location", detail.storageLocation],
                    ["Acquisition Type", detail.acquisitionType && t(detail.acquisitionType as string)],
                    ["Acquisition Date", detail.acquisitionDate],
                    ["Donor Name", detail.donorName],
                    ["Estimated Value", detail.estimatedValue],
                    ["Year of Origin", detail.yearOfOrigin],
                    ["Origin Location", detail.originLocation],
                  ] as [string, any][]).map(([k, v]) => (
                    <div key={k}>
                      <div className="text-xs text-muted-foreground">{t(k)}</div>
                      <div className="font-medium">{v || v === 0 ? v : "—"}</div>
                    </div>
                  ))}
                </div>
                {detail.description && <p>{detail.description}</p>}
                {detail.historicalNotes && (
                  <div><div className="text-xs text-muted-foreground">{t("Historical Notes")}</div><p>{detail.historicalNotes}</p></div>
                )}
                <div>
                  <div className="font-semibold mb-2">{t("Assignment History")}</div>
                  {(detail.assignmentHistory || []).length === 0 ? (
                    <p className="text-muted-foreground">{t("No assignments yet")}</p>
                  ) : (
                    <div className="space-y-2">
                      {(detail.assignmentHistory || []).map((a, i) => (
                        <div key={a.id || i} className="border rounded-md p-2">
                          <div className="font-medium">{a.assignedToFatherName || a.assignedToDepartment || "—"}</div>
                          <div className="text-xs text-muted-foreground">
                            {t(a.assignmentType as string)} · {a.assignedDate}
                            {a.expectedReturnDate ? ` → ${a.expectedReturnDate}` : ""}
                            {a.returnedDate ? ` · ${t("returned")} ${a.returnedDate}` : ""}
                          </div>
                          {a.notes && <div className="text-xs mt-1">{a.notes}</div>}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}

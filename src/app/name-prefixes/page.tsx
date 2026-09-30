"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { toast } from "sonner";
import { BadgeCheck, Plus, Edit, Search, RefreshCw, Power, PowerOff } from "lucide-react";

import { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/ui/DataTable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import DashboardLayout from "../dashboard/layout";
import {
  fetchNamePrefixes,
  createNamePrefix,
  updateNamePrefix,
  deactivateNamePrefix,
  activateNamePrefix,
  NamePrefix,
} from "@/services/namePrefixService";
import { useTranslation } from "react-i18next";

const emptyForm = { code: "", label: "", amharicLabel: "", appliesTo: "MALE" as "MALE" | "FEMALE" };

export default function NamePrefixManagement() {
  const { t } = useTranslation();
  const [prefixes, setPrefixes] = useState<NamePrefix[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [genderFilter, setGenderFilter] = useState("ALL");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isToggleDialogOpen, setIsToggleDialogOpen] = useState(false);
  const [selected, setSelected] = useState<NamePrefix | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formState, setFormState] = useState(emptyForm);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setPrefixes(await fetchNamePrefixes());
    } catch (err: any) {
      setError("Failed to load name prefixes. " + err.message);
      setPrefixes([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return prefixes.filter((p) => {
      if (genderFilter !== "ALL" && p.appliesTo !== genderFilter) return false;
      if (!q) return true;
      return (
        (p.code || "").toLowerCase().includes(q) ||
        (p.label || "").toLowerCase().includes(q) ||
        (p.amharicLabel || "").toLowerCase().includes(q)
      );
    });
  }, [prefixes, searchQuery, genderFilter]);

  const columns: ColumnDef<NamePrefix>[] = [
    {
      accessorKey: "label",
      header: t("Prefix"),
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <BadgeCheck className="h-5 w-5 text-primary" />
          </div>
          <div className="font-semibold">{row.original.label}</div>
        </div>
      ),
    },
    {
      accessorKey: "amharicLabel",
      header: t("Amharic Label"),
      cell: ({ row }) => <span className="text-sm">{row.original.amharicLabel || "-"}</span>,
    },
    {
      accessorKey: "code",
      header: t("Code"),
      cell: ({ row }) => <span className="text-sm font-mono">{row.original.code || "-"}</span>,
    },
    {
      accessorKey: "appliesTo",
      header: t("Applies To"),
      cell: ({ row }) => (
        <Badge variant="outline">
          {row.original.appliesTo === "MALE"
            ? t("Male")
            : row.original.appliesTo === "FEMALE"
            ? t("Female")
            : row.original.appliesTo || "-"}
        </Badge>
      ),
    },
    {
      accessorKey: "active",
      header: t("Status"),
      cell: ({ row }) => (
        <Badge
          className={
            row.original.active !== false ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
          }
        >
          {row.original.active !== false ? "ACTIVE" : "INACTIVE"}
        </Badge>
      ),
    },
    {
      id: "actions",
      cell: ({ row }) => (
        <div className="flex gap-2">
          <Button size="sm" variant="ghost" onClick={() => handleEdit(row.original)}>
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className={
              row.original.active !== false
                ? "text-red-600 hover:text-red-700 hover:bg-red-50"
                : "text-green-600 hover:text-green-700 hover:bg-green-50"
            }
            onClick={() => {
              setSelected(row.original);
              setIsToggleDialogOpen(true);
            }}
          >
            {row.original.active !== false ? <PowerOff className="h-4 w-4" /> : <Power className="h-4 w-4" />}
          </Button>
        </div>
      ),
    },
  ];

  const handleAdd = () => {
    setSelected(null);
    setFormState(emptyForm);
    setFormErrors({});
    setIsDialogOpen(true);
  };

  const handleEdit = (p: NamePrefix) => {
    setSelected(p);
    setFormState({
      code: p.code || "",
      label: p.label || "",
      amharicLabel: p.amharicLabel || "",
      appliesTo: (p.appliesTo === "FEMALE" ? "FEMALE" : "MALE") as "MALE" | "FEMALE",
    });
    setFormErrors({});
    setIsDialogOpen(true);
  };

  const handleSubmit = async () => {
    const errors: Record<string, string> = {};
    if (!formState.label.trim()) errors.label = t("Label is required");
    if (!formState.code.trim()) errors.code = t("Code is required");
    setFormErrors(errors);
    if (Object.keys(errors).length) return;

    setIsSubmitting(true);
    try {
      const payload = {
        code: formState.code.trim(),
        label: formState.label.trim(),
        amharicLabel: formState.amharicLabel.trim() || undefined,
        appliesTo: formState.appliesTo,
      };
      if (selected) {
        await updateNamePrefix(selected.id, payload);
        toast.success(t("Prefix updated successfully!"));
      } else {
        await createNamePrefix(payload);
        toast.success(t("Prefix created successfully!"));
      }
      setIsDialogOpen(false);
      await load();
    } catch (err: any) {
      toast.error(err.message || t("Operation failed"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggle = async () => {
    if (!selected) return;
    setIsSubmitting(true);
    try {
      if (selected.active !== false) {
        await deactivateNamePrefix(selected.id);
        toast.success(t("Prefix deactivated successfully!"));
      } else {
        await activateNamePrefix(selected.id);
        toast.success(t("Prefix activated successfully!"));
      }
      await load();
    } catch (err: any) {
      toast.error(err.message || t("Operation failed"));
    } finally {
      setIsSubmitting(false);
      setIsToggleDialogOpen(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold">{t("Name Prefixes")}</h1>
            <p className="text-muted-foreground">
              {t("Manage honorific prefixes (Ato, W/ro, Kes ...) used for children and fathers")}
            </p>
          </div>
          <Button onClick={handleAdd} size="lg">
            <Plus className="h-5 w-5 mr-2" /> {t("Add Prefix")}
          </Button>
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t("Search by label or code...")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={genderFilter} onValueChange={setGenderFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">{t("All genders")}</SelectItem>
              <SelectItem value="MALE">{t("Male")}</SelectItem>
              <SelectItem value="FEMALE">{t("Female")}</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="icon" onClick={() => load()} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-md p-3 text-sm">{error}</div>
        )}

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <DataTable columns={columns} data={filtered} />
        )}

        {/* Add / Edit dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle className="text-2xl">
                {selected ? t("Edit Prefix") : t("Add New Prefix")}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <Label>{t("Label (English)")} *</Label>
                <Input
                  value={formState.label}
                  onChange={(e) => {
                    setFormState({ ...formState, label: e.target.value });
                    if (formErrors.label) setFormErrors({ ...formErrors, label: "" });
                  }}
                  placeholder="e.g. Ato"
                  className={formErrors.label ? "border-destructive" : ""}
                />
                {formErrors.label && <p className="text-xs text-destructive mt-1">{formErrors.label}</p>}
              </div>
              <div>
                <Label>{t("Amharic Label")}</Label>
                <Input
                  value={formState.amharicLabel}
                  onChange={(e) => setFormState({ ...formState, amharicLabel: e.target.value })}
                  placeholder="e.g. አቶ"
                />
              </div>
              <div>
                <Label>{t("Code")} *</Label>
                <Input
                  value={formState.code}
                  onChange={(e) => {
                    setFormState({ ...formState, code: e.target.value });
                    if (formErrors.code) setFormErrors({ ...formErrors, code: "" });
                  }}
                  placeholder="e.g. ATO"
                  className={formErrors.code ? "border-destructive" : ""}
                />
                {formErrors.code && <p className="text-xs text-destructive mt-1">{formErrors.code}</p>}
              </div>
              <div>
                <Label>{t("Applies To")} *</Label>
                <Select
                  value={formState.appliesTo}
                  onValueChange={(v) => setFormState({ ...formState, appliesTo: v as "MALE" | "FEMALE" })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MALE">{t("Male")}</SelectItem>
                    <SelectItem value="FEMALE">{t("Female")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)} disabled={isSubmitting}>
                {t("Cancel")}
              </Button>
              <Button onClick={handleSubmit} disabled={isSubmitting}>
                {isSubmitting ? t("Saving...") : selected ? t("Update") : t("Create")}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Activate / deactivate dialog */}
        <Dialog open={isToggleDialogOpen} onOpenChange={setIsToggleDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {selected?.active !== false ? t("Deactivate Prefix?") : t("Activate Prefix?")}
              </DialogTitle>
            </DialogHeader>
            <p className="text-muted-foreground">
              {selected?.active !== false
                ? t("Are you sure you want to deactivate")
                : t("Are you sure you want to activate")}{" "}
              <strong>{selected?.label}</strong>?
            </p>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsToggleDialogOpen(false)}>
                {t("Cancel")}
              </Button>
              <Button
                variant={selected?.active !== false ? "destructive" : "default"}
                onClick={handleToggle}
                disabled={isSubmitting}
              >
                {isSubmitting ? t("Saving...") : selected?.active !== false ? t("Deactivate") : t("Activate")}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}

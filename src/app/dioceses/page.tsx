"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import {
  Landmark,
  Plus,
  Edit,
  Trash2,
  Search,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  XCircle,
  MapPin,
  User,
} from "lucide-react";

import { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/ui/DataTable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

import DashboardLayout from "../dashboard/layout";
import {
  fetchDioceses,
  createDiocese,
  updateDiocese,
  deactivateDiocese,
  Diocese,
} from "@/services/dioceseService";
import { useTranslation } from "react-i18next";

export default function DioceseManagement() {
  const [dioceses, setDioceses] = useState<Diocese[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [alert, setAlert] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedDiocese, setSelectedDiocese] = useState<Diocese | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { t } = useTranslation();

  const emptyForm = {
    name: "",
    nameEnglish: "",
    bishopName: "",
    location: "",
  };
  const [formState, setFormState] = useState(emptyForm);

  const loadDioceses = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchDioceses();
      setDioceses(data || []);
    } catch (err: any) {
      setError("Failed to load dioceses. " + err.message);
      setDioceses([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDioceses();
  }, [loadDioceses]);

  const filteredDioceses = useMemo(() => {
    return dioceses.filter(
      (d) =>
        d.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        d.nameEnglish?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        d.bishopName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        d.location?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [dioceses, searchQuery]);

  const columns: ColumnDef<Diocese>[] = [
    {
      accessorKey: "name",
      header: t("Diocese Name"),
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Landmark className="h-5 w-5 text-primary" />
          </div>
          <div>
            <div className="font-semibold">{row.original.name}</div>
            {row.original.nameEnglish && (
              <div className="text-sm text-muted-foreground">{row.original.nameEnglish}</div>
            )}
          </div>
        </div>
      ),
    },
    {
      accessorKey: "bishopName",
      header: t("Bishop"),
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <User className="h-3 w-3 text-muted-foreground" />
          <span className="text-sm">{row.original.bishopName || "-"}</span>
        </div>
      ),
    },
    {
      accessorKey: "location",
      header: t("Location"),
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <MapPin className="h-3 w-3 text-muted-foreground" />
          <span className="text-sm">{row.original.location || "-"}</span>
        </div>
      ),
    },
    {
      accessorKey: "active",
      header: t("Status"),
      cell: ({ row }) => (
        <Badge
          className={
            row.original.active !== false
              ? "bg-green-100 text-green-800"
              : "bg-red-100 text-red-800"
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
            className="text-red-600 hover:text-red-700 hover:bg-red-50"
            onClick={() => {
              setSelectedDiocese(row.original);
              setIsDeleteDialogOpen(true);
            }}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  const handleAdd = () => {
    setSelectedDiocese(null);
    setFormState(emptyForm);
    setIsDialogOpen(true);
  };

  const handleEdit = (diocese: Diocese) => {
    setFormState({
      name: diocese.name || "",
      nameEnglish: diocese.nameEnglish || "",
      bishopName: diocese.bishopName || "",
      location: diocese.location || "",
    });
    setSelectedDiocese(diocese);
    setIsDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!formState.name) {
      setAlert({ type: "error", message: "Diocese name is required" });
      return;
    }

    setIsSubmitting(true);
    setAlert(null);

    try {
      if (selectedDiocese) {
        await updateDiocese(selectedDiocese.id, formState);
        setAlert({ type: "success", message: "Diocese updated successfully!" });
      } else {
        await createDiocese(formState);
        setAlert({ type: "success", message: "Diocese created successfully!" });
      }

      await loadDioceses();
      setIsDialogOpen(false);
      setTimeout(() => setAlert(null), 3000);
    } catch (err: any) {
      setAlert({ type: "error", message: err.message || "Operation failed" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedDiocese) return;

    setIsSubmitting(true);
    try {
      await deactivateDiocese(selectedDiocese.id);
      setAlert({ type: "success", message: "Diocese deactivated successfully!" });
      await loadDioceses();
      setTimeout(() => setAlert(null), 3000);
    } catch (err: any) {
      setAlert({ type: "error", message: err.message || "Deactivation failed" });
    } finally {
      setIsSubmitting(false);
      setIsDeleteDialogOpen(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold">{t("Dioceses")}</h1>
            <p className="text-muted-foreground">{t("Manage dioceses and their bishops")}</p>
          </div>
          <Button onClick={handleAdd} size="lg">
            <Plus className="h-5 w-5 mr-2" /> {t("Add Diocese")}
          </Button>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {alert && (
          <Alert variant={alert.type === "error" ? "destructive" : "default"}>
            {alert.type === "success" ? <CheckCircle className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
            <AlertDescription>{alert.message}</AlertDescription>
          </Alert>
        )}

        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t("Search by name, bishop, or location...")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button variant="outline" size="icon" onClick={loadDioceses} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <DataTable columns={columns} data={filteredDioceses} />
        )}

        {/* Add/Edit Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle className="text-2xl">
                {selectedDiocese ? t("Edit Diocese") : t("Add New Diocese")}
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div>
                <Label>{t("Diocese Name")} *</Label>
                <Input
                  value={formState.name}
                  onChange={(e) => setFormState({ ...formState, name: e.target.value })}
                  placeholder={t("e.g. Addis Ababa Diocese")}
                />
              </div>
              <div>
                <Label>{t("Name (English)")}</Label>
                <Input
                  value={formState.nameEnglish}
                  onChange={(e) => setFormState({ ...formState, nameEnglish: e.target.value })}
                  placeholder={t("English name")}
                />
              </div>
              <div>
                <Label>{t("Bishop Name")}</Label>
                <Input
                  value={formState.bishopName}
                  onChange={(e) => setFormState({ ...formState, bishopName: e.target.value })}
                  placeholder={t("e.g. Abune X")}
                />
              </div>
              <div>
                <Label>{t("Location")}</Label>
                <Input
                  value={formState.location}
                  onChange={(e) => setFormState({ ...formState, location: e.target.value })}
                  placeholder={t("e.g. Addis Ababa, Ethiopia")}
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)} disabled={isSubmitting}>
                {t("Cancel")}
              </Button>
              <Button onClick={handleSubmit} disabled={isSubmitting}>
                {isSubmitting ? t("Saving...") : selectedDiocese ? t("Update") : t("Create")}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t("Deactivate Diocese?")}</DialogTitle>
            </DialogHeader>
            <p className="text-muted-foreground">
              {t("Are you sure you want to deactivate")} <strong>{selectedDiocese?.name}</strong>?{" "}
              {t("This diocese will be marked as inactive.")}
            </p>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
                {t("Cancel")}
              </Button>
              <Button variant="destructive" onClick={handleDelete} disabled={isSubmitting}>
                {isSubmitting ? t("Deactivating...") : t("Deactivate")}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}

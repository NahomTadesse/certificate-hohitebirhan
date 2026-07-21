"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import {
  Cross,
  Plus,
  Search,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  XCircle,
  ShieldOff,
  ShieldCheck,
  ScrollText,
} from "lucide-react";

import { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/ui/DataTable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

import DashboardLayout from "../dashboard/layout";
import {
  fetchDeathRecords,
  fetchDeathRecordsByMemberType,
  recordDeath,
  revokeDeathRecord,
  verifyDeathRecord,
  DeathRecord,
  MemberType,
} from "@/services/deathRecordService";
import { fetchChildrenForDropdown } from "@/services/childrenService";
import { fetchFathersForDropdown } from "@/services/fatherService";
import { useTranslation } from "react-i18next";

const MEMBER_TYPES: MemberType[] = ["CHILD", "FAMILY_HEAD", "CLERGY"];

export default function DeathRecordsManagement() {
  const [records, setRecords] = useState<DeathRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [alert, setAlert] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<MemberType | "ALL">("ALL");

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isRevokeDialogOpen, setIsRevokeDialogOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<DeathRecord | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [revokeReason, setRevokeReason] = useState("");

  const [memberOptions, setMemberOptions] = useState<{ id: string; fullName: string }[]>([]);

  const { t } = useTranslation();

  const emptyForm: {
    memberType: MemberType;
    memberId: string;
    occupation: string;
    rankOrTitle: string;
    dateOfDeath: string;
    burialPlace: string;
    officiant: string;
    remarks: string;
  } = {
    memberType: "CHILD",
    memberId: "",
    occupation: "",
    rankOrTitle: "",
    dateOfDeath: "",
    burialPlace: "",
    officiant: "",
    remarks: "",
  };
  const [formState, setFormState] = useState(emptyForm);

  const loadRecords = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data =
        typeFilter === "ALL"
          ? await fetchDeathRecords()
          : await fetchDeathRecordsByMemberType(typeFilter);
      setRecords(data || []);
    } catch (err: any) {
      setError("Failed to load death records. " + err.message);
      setRecords([]);
    } finally {
      setLoading(false);
    }
  }, [typeFilter]);

  useEffect(() => {
    loadRecords();
  }, [loadRecords]);

  // Load applicable member dropdown whenever member type changes in the form
  useEffect(() => {
    const loadMembers = async () => {
      try {
        if (formState.memberType === "CLERGY") {
          const fathers = await fetchFathersForDropdown();
          setMemberOptions(fathers.map((f) => ({ id: f.id, fullName: f.fullName })));
        } else {
          const children = await fetchChildrenForDropdown();
          setMemberOptions(children);
        }
      } catch {
        setMemberOptions([]);
      }
    };
    if (isDialogOpen) loadMembers();
  }, [formState.memberType, isDialogOpen]);

  const filteredRecords = useMemo(() => {
    return records.filter(
      (r) =>
        r.memberName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.registrationNo?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.burialPlace?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [records, searchQuery]);

  const columns: ColumnDef<DeathRecord>[] = [
    {
      accessorKey: "memberName",
      header: t("Deceased"),
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Cross className="h-5 w-5 text-primary" />
          </div>
          <div>
            <div className="font-semibold">{row.original.fullName || row.original.memberId}</div>
            <div className="text-sm text-muted-foreground">{row.original.registrationNo || "-"}</div>
          </div>
        </div>
      ),
    },
    {
      accessorKey: "memberType",
      header: t("Type"),
      cell: ({ row }) => <Badge variant="outline">{row.original.memberType}</Badge>,
    },
    {
      accessorKey: "dateOfDeath",
      header: t("Date of Death"),
      cell: ({ row }) => <span className="text-sm">{row.original.dateOfDeath || "-"}</span>,
    },
    {
      accessorKey: "burialPlace",
      header: t("Burial Place"),
      cell: ({ row }) => <span className="text-sm">{row.original.burialPlace || "-"}</span>,
    },
    {
      accessorKey: "revoked",
      header: t("Status"),
      cell: ({ row }) => (
        <Badge
          className={
            row.original.revoked
              ? "bg-red-100 text-red-800"
              : "bg-green-100 text-green-800"
          }
        >
          {row.original.revoked ? t("REVOKED") : t("VALID")}
        </Badge>
      ),
    },
    {
      id: "actions",
      cell: ({ row }) => (
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="ghost"
            title={t("Verify")}
            onClick={() => handleVerify(row.original)}
          >
            <ShieldCheck className="h-4 w-4" />
          </Button>
          {!row.original.revoked && (
            <Button
              size="sm"
              variant="ghost"
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
              title={t("Revoke")}
              onClick={() => {
                setSelectedRecord(row.original);
                setRevokeReason("");
                setIsRevokeDialogOpen(true);
              }}
            >
              <ShieldOff className="h-4 w-4" />
            </Button>
          )}
        </div>
      ),
    },
  ];

  const handleAdd = () => {
    setFormState(emptyForm);
    setIsDialogOpen(true);
  };

  const handleVerify = async (record: DeathRecord) => {
    if (!record.registrationNo) {
      setAlert({ type: "error", message: "No registration number available for this record." });
      return;
    }
    try {
      const res = await verifyDeathRecord(record.registrationNo);
      setAlert({
        type: res?.success !== false ? "success" : "error",
        message: res?.message || "Verification complete.",
      });
    } catch (err: any) {
      setAlert({ type: "error", message: err.message || "Verification failed" });
    } finally {
      setTimeout(() => setAlert(null), 4000);
    }
  };

  const handleSubmit = async () => {
    if (!formState.memberId || !formState.dateOfDeath) {
      setAlert({ type: "error", message: "Member and date of death are required" });
      return;
    }

    setIsSubmitting(true);
    setAlert(null);

    try {
      await recordDeath(formState);
      setAlert({ type: "success", message: "Death record created successfully!" });
      await loadRecords();
      setIsDialogOpen(false);
      setTimeout(() => setAlert(null), 3000);
    } catch (err: any) {
      setAlert({ type: "error", message: err.message || "Operation failed" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRevoke = async () => {
    if (!selectedRecord?.registrationNo || !revokeReason) {
      setAlert({ type: "error", message: "A reason is required to revoke this record." });
      return;
    }
    setIsSubmitting(true);
    try {
      await revokeDeathRecord(selectedRecord.registrationNo, { reason: revokeReason });
      setAlert({ type: "success", message: "Death record revoked successfully!" });
      await loadRecords();
      setTimeout(() => setAlert(null), 3000);
    } catch (err: any) {
      setAlert({ type: "error", message: err.message || "Revocation failed" });
    } finally {
      setIsSubmitting(false);
      setIsRevokeDialogOpen(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <ScrollText className="h-7 w-7" /> {t("Death Records")}
            </h1>
            <p className="text-muted-foreground">
              {t("Record, verify, and manage death records for members, family heads, and clergy")}
            </p>
          </div>
          <Button onClick={handleAdd} size="lg">
            <Plus className="h-5 w-5 mr-2" /> {t("Record Death")}
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
              placeholder={t("Search by name, registration no, or burial place...")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v as MemberType | "ALL")}>
            <SelectTrigger className="w-full sm:w-56">
              <SelectValue placeholder={t("Filter by type")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">{t("All Types")}</SelectItem>
              {MEMBER_TYPES.map((type) => (
                <SelectItem key={type} value={type}>
                  {type}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button variant="outline" size="icon" onClick={loadRecords} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <DataTable columns={columns} data={filteredRecords} />
        )}

        {/* Record Death Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle className="text-2xl">{t("Record Death")}</DialogTitle>
            </DialogHeader>

            <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
              <div>
                <Label>{t("Member Type")} *</Label>
                <Select
                  value={formState.memberType}
                  onValueChange={(v) =>
                    setFormState({ ...formState, memberType: v as MemberType, memberId: "" })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {MEMBER_TYPES.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>{t("Member")} *</Label>
                <Select
                  value={formState.memberId}
                  onValueChange={(v) => setFormState({ ...formState, memberId: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t("Select member")} />
                  </SelectTrigger>
                  <SelectContent>
                    {memberOptions.map((m) => (
                      <SelectItem key={m.id} value={m.id}>
                        {m.fullName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>{t("Date of Death")} *</Label>
                <Input
                  type="date"
                  value={formState.dateOfDeath}
                  onChange={(e) => setFormState({ ...formState, dateOfDeath: e.target.value })}
                />
              </div>

              {formState.memberType === "CLERGY" && (
                <div>
                  <Label>{t("Rank / Title")}</Label>
                  <Input
                    value={formState.rankOrTitle}
                    onChange={(e) => setFormState({ ...formState, rankOrTitle: e.target.value })}
                    placeholder={t("e.g. Archpriest")}
                  />
                </div>
              )}

              <div>
                <Label>{t("Occupation")}</Label>
                <Input
                  value={formState.occupation}
                  onChange={(e) => setFormState({ ...formState, occupation: e.target.value })}
                />
              </div>

              <div>
                <Label>{t("Burial Place")}</Label>
                <Input
                  value={formState.burialPlace}
                  onChange={(e) => setFormState({ ...formState, burialPlace: e.target.value })}
                />
              </div>

              <div>
                <Label>{t("Officiant")}</Label>
                <Input
                  value={formState.officiant}
                  onChange={(e) => setFormState({ ...formState, officiant: e.target.value })}
                  placeholder={t("Officiating priest name")}
                />
              </div>

              <div>
                <Label>{t("Remarks")}</Label>
                <Input
                  value={formState.remarks}
                  onChange={(e) => setFormState({ ...formState, remarks: e.target.value })}
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)} disabled={isSubmitting}>
                {t("Cancel")}
              </Button>
              <Button onClick={handleSubmit} disabled={isSubmitting}>
                {isSubmitting ? t("Saving...") : t("Record Death")}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Revoke Dialog */}
        <Dialog open={isRevokeDialogOpen} onOpenChange={setIsRevokeDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t("Revoke Death Record?")}</DialogTitle>
            </DialogHeader>
            <p className="text-muted-foreground">
              {t("Are you sure you want to revoke this death record for")}{" "}
              <strong>{selectedRecord?.memberName || selectedRecord?.memberId}</strong>?
            </p>
            <div>
              <Label>{t("Reason")} *</Label>
              <Input
                value={revokeReason}
                onChange={(e) => setRevokeReason(e.target.value)}
                placeholder={t("Reason for revocation")}
              />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsRevokeDialogOpen(false)}>
                {t("Cancel")}
              </Button>
              <Button variant="destructive" onClick={handleRevoke} disabled={isSubmitting}>
                {isSubmitting ? t("Revoking...") : t("Revoke")}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}

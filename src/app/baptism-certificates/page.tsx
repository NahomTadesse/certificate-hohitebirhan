"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { toast } from "sonner";
import {
  Droplets,
  Plus,
  Search,
  RefreshCw,
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
  fetchBaptismCertificates,
  searchBaptismCertificates,
  issueBaptismCertificate,
  revokeBaptismCertificate,
  verifyBaptismCertificate,
  BaptismCertificatePayload,
} from "@/services/baptismCertificateService";
import { fetchChurchesForDropdown } from "@/services/churchService";
import { fetchFathersForDropdown } from "@/services/fatherService";
import { useTranslation } from "react-i18next";

// Unified brand color for certificates - a deep blue-green (teal) mix
const CERT_COLOR = "#0d5c63";

interface BaptismRecord extends BaptismCertificatePayload {
  registrationNo?: string;
  revoked?: boolean;
}

const emptyForm: BaptismCertificatePayload = {
  familyName: "",
  properName: "",
  christianName: "",
  fatherName: "",
  motherName: "",
  godParentName: "",
  country: "",
  placeOfBirth: "",
  nationality: "",
  dateOfBirth: "",
  dateOfBaptism: "",
  church: "",
  citizenship: "",
  baptizingPriestId: "",
  baptizingPriestName: "",
  churchAdministratorName: "",
};

export default function BaptismCertificatesManagement() {
  const { t } = useTranslation();

  const [churches, setChurches] = useState<{ id: string; name: string }[]>([]);
  const [churchId, setChurchId] = useState("");
  const [priests, setPriests] = useState<{ id: string; fullName: string }[]>([]);

  const [records, setRecords] = useState<BaptismRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isRevokeDialogOpen, setIsRevokeDialogOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<BaptismRecord | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [revokeReason, setRevokeReason] = useState("");

  const [issueChildId, setIssueChildId] = useState("");
  const [formState, setFormState] = useState<BaptismCertificatePayload>(emptyForm);

  useEffect(() => {
    (async () => {
      try {
        const [churchData, priestData] = await Promise.all([
          fetchChurchesForDropdown(),
          fetchFathersForDropdown(),
        ]);
        setChurches(churchData || []);
        setPriests(priestData || []);
        if (churchData && churchData.length > 0) setChurchId((prev) => prev || churchData[0].id);
      } catch {
        // ignore
      }
    })();
  }, []);

  const loadRecords = useCallback(
    async (search?: string) => {
      if (!churchId) return;
      setLoading(true);
      setError(null);
      try {
        const page =
          search && search.trim()
            ? await searchBaptismCertificates(churchId, search.trim(), 0, 50)
            : await fetchBaptismCertificates(churchId, 0, 50);
        setRecords(page.content || []);
      } catch (err: any) {
        setError("Failed to load baptism certificates. " + err.message);
        setRecords([]);
      } finally {
        setLoading(false);
      }
    },
    [churchId]
  );

  useEffect(() => {
    loadRecords();
  }, [loadRecords]);

  const isFirstSearchRender = useRef(true);
  useEffect(() => {
    if (isFirstSearchRender.current) {
      isFirstSearchRender.current = false;
      return;
    }
    const handle = setTimeout(() => {
      loadRecords(searchQuery);
    }, 400);
    return () => clearTimeout(handle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery]);

  const filteredRecords = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) return records;
    return records.filter(
      (r) =>
        (r.properName || "").toLowerCase().includes(query) ||
        (r.christianName || "").toLowerCase().includes(query) ||
        (r.familyName || "").toLowerCase().includes(query) ||
        (r.registrationNo || "").toLowerCase().includes(query)
    );
  }, [records, searchQuery]);

  const columns: ColumnDef<BaptismRecord>[] = [
    {
      accessorKey: "properName",
      header: t("Name"),
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg" style={{ backgroundColor: "#e6f3f2" }}>
            <Droplets className="h-5 w-5" style={{ color: CERT_COLOR }} />
          </div>
          <div>
            <div className="font-semibold">
              {[row.original.properName, row.original.christianName, row.original.familyName]
                .filter(Boolean)
                .join(" ")}
            </div>
            <div className="text-sm text-muted-foreground">{row.original.registrationNo || "-"}</div>
          </div>
        </div>
      ),
    },
    {
      accessorKey: "dateOfBaptism",
      header: t("Date of Baptism"),
      cell: ({ row }) => <span className="text-sm">{row.original.dateOfBaptism || "-"}</span>,
    },
    {
      accessorKey: "church",
      header: t("Church"),
      cell: ({ row }) => <span className="text-sm">{row.original.church || "-"}</span>,
    },
    {
      accessorKey: "baptizingPriestName",
      header: t("Baptizing Priest"),
      cell: ({ row }) => <span className="text-sm">{row.original.baptizingPriestName || "-"}</span>,
    },
    {
      accessorKey: "revoked",
      header: t("Status"),
      cell: ({ row }) => (
        <Badge
          className={row.original.revoked ? "bg-red-100 text-red-800" : "bg-green-100 text-green-800"}
        >
          {row.original.revoked ? t("REVOKED") : t("VALID")}
        </Badge>
      ),
    },
    {
      id: "actions",
      cell: ({ row }) => (
        <div className="flex gap-2">
          <Button size="sm" variant="ghost" title={t("Verify")} onClick={() => handleVerify(row.original)}>
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
    setFormState({ ...emptyForm, church: churches.find((c) => c.id === churchId)?.name || "" });
    setIssueChildId("");
    setIsDialogOpen(true);
  };

  const handleVerify = async (record: BaptismRecord) => {
    if (!record.registrationNo) {
      toast.error("No registration number available for this record.");
      return;
    }
    try {
      const res = await verifyBaptismCertificate(record.registrationNo);
      if (res?.success !== false) {
        toast.success(res?.message || "Verification complete.");
      } else {
        toast.error(res?.message || "Verification complete.");
      }
    } catch (err: any) {
      toast.error(err.message || "Verification failed");
    }
  };

  const handleSubmit = async () => {
    if (!issueChildId || !formState.dateOfBaptism) {
      toast.error("Child and date of baptism are required");
      return;
    }
    setIsSubmitting(true);
    try {
      await issueBaptismCertificate(issueChildId, formState);
      toast.success("Baptism certificate issued successfully!");
      await loadRecords();
      setIsDialogOpen(false);
    } catch (err: any) {
      toast.error(err.message || "Operation failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRevoke = async () => {
    if (!selectedRecord?.registrationNo || !revokeReason) {
      toast.error("A reason is required to revoke this certificate.");
      return;
    }
    setIsSubmitting(true);
    try {
      await revokeBaptismCertificate(selectedRecord.registrationNo, { reason: revokeReason });
      toast.success("Baptism certificate revoked successfully!");
      await loadRecords();
    } catch (err: any) {
      toast.error(err.message || "Revocation failed");
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
              <ScrollText className="h-7 w-7" style={{ color: CERT_COLOR }} /> {t("Baptism / Birth Certificates")}
            </h1>
            <p className="text-muted-foreground">
              {t("Issue, verify, and manage baptism certificates for children")}
            </p>
          </div>
          {/* <Button onClick={handleAdd} size="lg" disabled={!churchId} style={{ backgroundColor: CERT_COLOR }}>
            <Plus className="h-5 w-5 mr-2" /> {t("Issue Certificate")}
          </Button> */}
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t("Search by name or registration no...")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          <Select value={churchId} onValueChange={setChurchId}>
            <SelectTrigger className="w-full sm:w-56">
              <SelectValue placeholder={t("Select a church")} />
            </SelectTrigger>
            <SelectContent>
              {churches.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button variant="outline" size="icon" onClick={() => loadRecords()} disabled={loading}>
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

        {/* Issue Certificate Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle className="text-2xl">{t("Issue Baptism Certificate")}</DialogTitle>
            </DialogHeader>

            <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
              <div>
                <Label>{t("Child ID")} *</Label>
                <Input
                  value={issueChildId}
                  onChange={(e) => setIssueChildId(e.target.value)}
                  placeholder={t("Child ID to issue the certificate for")}
                />
              </div>

              <div>
                <Label>{t("Family Name")}</Label>
                <Input
                  value={formState.familyName}
                  onChange={(e) => setFormState({ ...formState, familyName: e.target.value })}
                />
              </div>
              <div>
                <Label>{t("Proper Name")}</Label>
                <Input
                  value={formState.properName}
                  onChange={(e) => setFormState({ ...formState, properName: e.target.value })}
                />
              </div>
              <div>
                <Label>{t("Christian Name")}</Label>
                <Input
                  value={formState.christianName}
                  onChange={(e) => setFormState({ ...formState, christianName: e.target.value })}
                />
              </div>
              <div>
                <Label>{t("Father's Name")}</Label>
                <Input
                  value={formState.fatherName}
                  onChange={(e) => setFormState({ ...formState, fatherName: e.target.value })}
                />
              </div>
              <div>
                <Label>{t("Mother's Name")}</Label>
                <Input
                  value={formState.motherName}
                  onChange={(e) => setFormState({ ...formState, motherName: e.target.value })}
                />
              </div>
              <div>
                <Label>{t("God Parent's Name")}</Label>
                <Input
                  value={formState.godParentName}
                  onChange={(e) => setFormState({ ...formState, godParentName: e.target.value })}
                />
              </div>
              <div>
                <Label>{t("Country")}</Label>
                <Input
                  value={formState.country}
                  onChange={(e) => setFormState({ ...formState, country: e.target.value })}
                />
              </div>
              <div>
                <Label>{t("Place of Birth")}</Label>
                <Input
                  value={formState.placeOfBirth}
                  onChange={(e) => setFormState({ ...formState, placeOfBirth: e.target.value })}
                />
              </div>
              <div>
                <Label>{t("Nationality")}</Label>
                <Input
                  value={formState.nationality}
                  onChange={(e) => setFormState({ ...formState, nationality: e.target.value })}
                />
              </div>
              <div>
                <Label>{t("Date of Birth")}</Label>
                <Input
                  type="date"
                  value={formState.dateOfBirth}
                  onChange={(e) => setFormState({ ...formState, dateOfBirth: e.target.value })}
                />
              </div>
              <div>
                <Label>{t("Date of Baptism")} *</Label>
                <Input
                  type="date"
                  value={formState.dateOfBaptism}
                  onChange={(e) => setFormState({ ...formState, dateOfBaptism: e.target.value })}
                />
              </div>
              <div>
                <Label>{t("Church")}</Label>
                <Input
                  value={formState.church}
                  onChange={(e) => setFormState({ ...formState, church: e.target.value })}
                />
              </div>
              <div>
                <Label>{t("Citizenship")}</Label>
                <Input
                  value={formState.citizenship}
                  onChange={(e) => setFormState({ ...formState, citizenship: e.target.value })}
                />
              </div>
              <div>
                <Label>{t("Baptizing Priest")}</Label>
                <Select
                  value={formState.baptizingPriestId}
                  onValueChange={(v) =>
                    setFormState({
                      ...formState,
                      baptizingPriestId: v,
                      baptizingPriestName: priests.find((p) => p.id === v)?.fullName || "",
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t("Select priest")} />
                  </SelectTrigger>
                  <SelectContent>
                    {priests.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.fullName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>{t("Church Administrator Name")}</Label>
                <Input
                  value={formState.churchAdministratorName}
                  onChange={(e) => setFormState({ ...formState, churchAdministratorName: e.target.value })}
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)} disabled={isSubmitting}>
                {t("Cancel")}
              </Button>
              <Button onClick={handleSubmit} disabled={isSubmitting} style={{ backgroundColor: CERT_COLOR }}>
                {isSubmitting ? t("Issuing...") : t("Issue Certificate")}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Revoke Dialog */}
        <Dialog  open={isRevokeDialogOpen} onOpenChange={setIsRevokeDialogOpen}>
          <DialogContent className="max-w-200">
            <DialogHeader>
              <DialogTitle>{t("Revoke Baptism Certificate?")}</DialogTitle>
            </DialogHeader>
            <p className="text-muted-foreground">
              {t("Are you sure you want to revoke this certificate for")}{" "}
              <strong>{selectedRecord?.properName || selectedRecord?.registrationNo}</strong>?
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

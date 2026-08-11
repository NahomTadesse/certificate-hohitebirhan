"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { toast } from "sonner";
import {
  HeartHandshake,
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
  fetchWeddingCertificates,
  searchWeddingCertificates,
  issueWeddingCertificate,
  revokeWeddingCertificate,
  verifyWeddingCertificate,
  WeddingCertificatePayload,
} from "@/services/weddingCertificateService";
import { fetchChurchesForDropdown } from "@/services/churchService";
import { fetchFathersForDropdown } from "@/services/fatherService";
import { fetchChildrenForDropdown } from "@/services/childrenService";
import { useTranslation } from "react-i18next";

// Unified brand color for certificates - a deep blue-green (teal) mix
const CERT_COLOR = "#0d5c63";

interface WeddingRecord extends WeddingCertificatePayload {
  registrationNo?: string;
  revoked?: boolean;
}

const emptyForm: WeddingCertificatePayload = {
  groomChildId: "",
  groomFullName: "",
  groomNationality: "",
  brideChildId: "",
  brideFullName: "",
  brideNationality: "",
  country: "",
  church: "",
  officiatingPriestId: "",
  officiatingPriestName: "",
  witness1Name: "",
  witness2Name: "",
  witness3Name: "",
  dateOfMarriage: "",
  churchAdministratorName: "",
};

export default function WeddingCertificatesManagement() {
  const { t } = useTranslation();

  const [churches, setChurches] = useState<{ id: string; name: string }[]>([]);
  const [churchId, setChurchId] = useState("");
  const [priests, setPriests] = useState<{ id: string; fullName: string }[]>([]);
  const [children, setChildren] = useState<{ id: string; fullName: string }[]>([]);

  const [records, setRecords] = useState<WeddingRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isRevokeDialogOpen, setIsRevokeDialogOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<WeddingRecord | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [revokeReason, setRevokeReason] = useState("");

  const [formState, setFormState] = useState<WeddingCertificatePayload>(emptyForm);

  useEffect(() => {
    (async () => {
      try {
        const [churchData, priestData, childrenData] = await Promise.all([
          fetchChurchesForDropdown(),
          fetchFathersForDropdown(),
          fetchChildrenForDropdown(),
        ]);
        setChurches(churchData || []);
        setPriests(priestData || []);
        setChildren(childrenData || []);
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
            ? await searchWeddingCertificates(churchId, search.trim(), 0, 50)
            : await fetchWeddingCertificates(churchId, 0, 50);
        setRecords(page.content || []);
      } catch (err: any) {
        const message = "Failed to load wedding certificates. " + err.message;
        setError(message);
        toast.error(message);
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
        (r.groomFullName || "").toLowerCase().includes(query) ||
        (r.brideFullName || "").toLowerCase().includes(query) ||
        (r.registrationNo || "").toLowerCase().includes(query)
    );
  }, [records, searchQuery]);

  const columns: ColumnDef<WeddingRecord>[] = [
    {
      accessorKey: "groomFullName",
      header: t("Couple"),
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg" style={{ backgroundColor: "#e6f3f2" }}>
            <HeartHandshake className="h-5 w-5" style={{ color: CERT_COLOR }} />
          </div>
          <div>
            <div className="font-semibold">
              {row.original.groomFullName} &amp; {row.original.brideFullName}
            </div>
            <div className="text-sm text-muted-foreground">{row.original.registrationNo || "-"}</div>
          </div>
        </div>
      ),
    },
    {
      accessorKey: "dateOfMarriage",
      header: t("Date of Marriage"),
      cell: ({ row }) => <span className="text-sm">{row.original.dateOfMarriage || "-"}</span>,
    },
    {
      accessorKey: "church",
      header: t("Church"),
      cell: ({ row }) => <span className="text-sm">{row.original.church || "-"}</span>,
    },
    {
      accessorKey: "officiatingPriestName",
      header: t("Officiating Priest"),
      cell: ({ row }) => <span className="text-sm">{row.original.officiatingPriestName || "-"}</span>,
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
    setIsDialogOpen(true);
  };

  const handleVerify = async (record: WeddingRecord) => {
    if (!record.registrationNo) {
      toast.error("No registration number available for this record.");
      return;
    }
    try {
      const res = await verifyWeddingCertificate(record.registrationNo);
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
    if (!formState.groomFullName || !formState.brideFullName || !formState.dateOfMarriage) {
      toast.error("Groom, bride, and date of marriage are required");
      return;
    }
    setIsSubmitting(true);
    try {
      await issueWeddingCertificate(formState);
      toast.success("Wedding certificate issued successfully!");
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
      await revokeWeddingCertificate(selectedRecord.registrationNo, { reason: revokeReason });
      toast.success("Wedding certificate revoked successfully!");
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
              <ScrollText className="h-7 w-7" style={{ color: CERT_COLOR }} /> {t("Wedding Certificates")}
            </h1>
            <p className="text-muted-foreground">
              {t("Issue, verify, and manage wedding certificates")}
            </p>
          </div>
          <Button onClick={handleAdd} size="lg" disabled={!churchId} style={{ backgroundColor: CERT_COLOR }}>
            <Plus className="h-5 w-5 mr-2" /> {t("Issue Certificate")}
          </Button>
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t("Search by groom, bride, or registration no...")}
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

        {error && (
          <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">
            {error}
          </div>
        )}

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
              <DialogTitle className="text-2xl">{t("Issue Wedding Certificate")}</DialogTitle>
            </DialogHeader>

            <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
              <div>
                <Label>{t("Groom")}</Label>
                <Select
                  value={formState.groomChildId}
                  onValueChange={(v) =>
                    setFormState({
                      ...formState,
                      groomChildId: v,
                      groomFullName: children.find((c) => c.id === v)?.fullName || formState.groomFullName,
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t("Select groom (optional)")} />
                  </SelectTrigger>
                  <SelectContent>
                    {children.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.fullName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>{t("Groom Full Name")} *</Label>
                <Input
                  value={formState.groomFullName}
                  onChange={(e) => setFormState({ ...formState, groomFullName: e.target.value })}
                />
              </div>
              <div>
                <Label>{t("Groom Nationality")}</Label>
                <Input
                  value={formState.groomNationality}
                  onChange={(e) => setFormState({ ...formState, groomNationality: e.target.value })}
                />
              </div>

              <div>
                <Label>{t("Bride")}</Label>
                <Select
                  value={formState.brideChildId}
                  onValueChange={(v) =>
                    setFormState({
                      ...formState,
                      brideChildId: v,
                      brideFullName: children.find((c) => c.id === v)?.fullName || formState.brideFullName,
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t("Select bride (optional)")} />
                  </SelectTrigger>
                  <SelectContent>
                    {children.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.fullName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>{t("Bride Full Name")} *</Label>
                <Input
                  value={formState.brideFullName}
                  onChange={(e) => setFormState({ ...formState, brideFullName: e.target.value })}
                />
              </div>
              <div>
                <Label>{t("Bride Nationality")}</Label>
                <Input
                  value={formState.brideNationality}
                  onChange={(e) => setFormState({ ...formState, brideNationality: e.target.value })}
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
                <Label>{t("Church")}</Label>
                <Input
                  value={formState.church}
                  onChange={(e) => setFormState({ ...formState, church: e.target.value })}
                />
              </div>
              <div>
                <Label>{t("Officiating Priest")}</Label>
                <Select
                  value={formState.officiatingPriestId}
                  onValueChange={(v) =>
                    setFormState({
                      ...formState,
                      officiatingPriestId: v,
                      officiatingPriestName: priests.find((p) => p.id === v)?.fullName || "",
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
                <Label>{t("Witness 1")}</Label>
                <Input
                  value={formState.witness1Name}
                  onChange={(e) => setFormState({ ...formState, witness1Name: e.target.value })}
                />
              </div>
              <div>
                <Label>{t("Witness 2")}</Label>
                <Input
                  value={formState.witness2Name}
                  onChange={(e) => setFormState({ ...formState, witness2Name: e.target.value })}
                />
              </div>
              <div>
                <Label>{t("Witness 3")}</Label>
                <Input
                  value={formState.witness3Name}
                  onChange={(e) => setFormState({ ...formState, witness3Name: e.target.value })}
                />
              </div>
              <div>
                <Label>{t("Date of Marriage")} *</Label>
                <Input
                  type="date"
                  value={formState.dateOfMarriage}
                  onChange={(e) => setFormState({ ...formState, dateOfMarriage: e.target.value })}
                />
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
        <Dialog open={isRevokeDialogOpen} onOpenChange={setIsRevokeDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t("Revoke Wedding Certificate?")}</DialogTitle>
            </DialogHeader>
            <p className="text-muted-foreground">
              {t("Are you sure you want to revoke this certificate for")}{" "}
              <strong>
                {selectedRecord?.groomFullName} &amp; {selectedRecord?.brideFullName}
              </strong>
              ?
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

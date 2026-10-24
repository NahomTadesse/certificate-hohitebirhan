"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Search, Upload } from "lucide-react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { fetchFamilies, searchFamilies, bulkPromoteFamilies } from "@/services/familyService";
import { fetchChurchesForDropdown } from "@/services/churchService";
import { unwrapPage } from "@/services/serviceHelpers";

// "Browse Families": GET /api/families/families and /api/families/families/search
export function FamilyBrowser() {
  const { t } = useTranslation();
  const [churches, setChurches] = useState<{ id: string; name: string }[]>([]);
  const [churchId, setChurchId] = useState("");
  const [f, setF] = useState({ firstName: "", lastName: "", sebekaMemberId: "", gender: "" });
  const [rows, setRows] = useState<any[]>([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchChurchesForDropdown()
      .then((c) => {
        setChurches(c);
        if (c[0]) setChurchId((p) => p || c[0].id);
      })
      .catch(() => {});
  }, []);

  const load = useCallback(
    async (p = 0) => {
      if (!churchId) return;
      setLoading(true);
      try {
        const hasFilter = f.firstName || f.lastName || f.sebekaMemberId || f.gender;
        const res = hasFilter
          ? await searchFamilies(churchId, { ...f, gender: (f.gender as any) || undefined }, p, 20)
          : await fetchFamilies(churchId, p, 20);
        const pg = unwrapPage<any>(res);
        setRows(pg.content || []);
        setTotalPages(pg.totalPages || 0);
        setPage(p);
      } catch (err: any) {
        toast.error(err.message || t("Failed to load families"));
        setRows([]);
      } finally {
        setLoading(false);
      }
    },
    [churchId, f, t]
  );

  useEffect(() => {
    if (churchId) load(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [churchId]);

  const name = (r: any) => r.fullName || [r.firstName, r.middleName, r.lastName].filter(Boolean).join(" ") || r.headName || "—";

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-5 gap-3 items-end">
        <div>
          <Label>{t("Church")}</Label>
          <Select value={churchId} onValueChange={setChurchId}>
            <SelectTrigger><SelectValue placeholder={t("Select a church")} /></SelectTrigger>
            <SelectContent>{churches.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div><Label>{t("First Name")}</Label><Input value={f.firstName} onChange={(e) => setF({ ...f, firstName: e.target.value })} /></div>
        <div><Label>{t("Last Name")}</Label><Input value={f.lastName} onChange={(e) => setF({ ...f, lastName: e.target.value })} /></div>
        <div><Label>{t("Sebeka Member ID")}</Label><Input value={f.sebekaMemberId} onChange={(e) => setF({ ...f, sebekaMemberId: e.target.value })} /></div>
        <div className="flex gap-2">
          <Select value={f.gender || "all"} onValueChange={(v) => setF({ ...f, gender: v === "all" ? "" : v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("All")}</SelectItem>
              <SelectItem value="MALE">{t("Male")}</SelectItem>
              <SelectItem value="FEMALE">{t("Female")}</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={() => load(0)} disabled={loading}><Search className="h-4 w-4" /></Button>
        </div>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t("Family Head")}</TableHead>
            <TableHead>{t("Sebeka Member ID")}</TableHead>
            <TableHead>{t("Gender")}</TableHead>
            <TableHead>{t("Members")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading && <TableRow><TableCell colSpan={4} className="text-center py-6 text-muted-foreground">{t("Loading...")}</TableCell></TableRow>}
          {!loading && rows.length === 0 && <TableRow><TableCell colSpan={4} className="text-center py-6 text-muted-foreground">{t("No families found")}</TableCell></TableRow>}
          {rows.map((r, i) => (
            <TableRow key={r.id || i}>
              <TableCell className="font-medium">{name(r)}</TableCell>
              <TableCell>{r.sebekaMemberId || "—"}</TableCell>
              <TableCell>{r.gender || "—"}</TableCell>
              <TableCell className="text-sm">
                {Array.isArray(r.members)
                  ? r.members.map((m: any) => `${name(m)}${m.relationType ? ` (${m.relationType})` : ""}`).join(", ")
                  : r.memberCount ?? "—"}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      {totalPages > 1 && (
        <div className="flex items-center justify-end gap-2">
          <Button size="sm" variant="outline" disabled={page === 0} onClick={() => load(page - 1)}>{t("Previous")}</Button>
          <span className="text-sm text-muted-foreground">{page + 1} / {totalPages}</span>
          <Button size="sm" variant="outline" disabled={page + 1 >= totalPages} onClick={() => load(page + 1)}>{t("Next")}</Button>
        </div>
      )}
    </div>
  );
}

// "Bulk Promote": POST /api/families/bulk-promote (multipart "file")
export function BulkPromote() {
  const { t } = useTranslation();
  const ref = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<any>(null);

  const upload = async () => {
    if (!file) return;
    setBusy(true);
    try {
      const res = await bulkPromoteFamilies(file);
      setResult(res);
      toast.success(res?.message || t("Families promoted successfully!"));
      setFile(null);
    } catch (err: any) {
      toast.error(err.message || t("Upload failed"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-4 max-w-xl">
      <p className="text-sm text-muted-foreground">
        {t("Upload a spreadsheet (.xlsx / .csv) of children to promote to family heads in one go.")}
      </p>
      <input ref={ref} type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={(e) => setFile(e.target.files?.[0] || null)} />
      <div className="flex items-center gap-3">
        <Button variant="outline" onClick={() => ref.current?.click()}><Upload className="h-4 w-4 mr-2" />{t("Choose file")}</Button>
        <span className="text-sm">{file?.name || t("No file chosen")}</span>
      </div>
      <Button onClick={upload} disabled={!file || busy}>{busy ? t("Uploading...") : t("Upload & Promote")}</Button>
      {result && (
        <Alert>
          <AlertDescription className="whitespace-pre-wrap break-words text-xs">
            {typeof result.data === "string" ? result.data : JSON.stringify(result.data ?? result, null, 2)}
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}

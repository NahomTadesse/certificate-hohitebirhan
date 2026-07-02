
"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import {
  Users,
  Plus,
  Edit,
  Trash2,
  Search,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  XCircle,
  Phone,
  Calendar,
  User,
  UserRound,
  GitBranch,
  History,
  Banknote,
  FileText,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import DashboardLayout from "../dashboard/layout";
import {
  fetchChildren,
  createChild,
  changeFather,
  deleteChild,
  Child,
} from "@/services/childrenService";
import { fetchFathersForDropdown, Father } from "@/services/fatherService";
import { fetchFatherTransfersByChild } from "@/services/fatherTransferService";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";

export default function ChildrenManagement() {
  const [children, setChildren] = useState<Child[]>([]);
  const [fathers, setFathers] = useState<Father[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [alert, setAlert] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isChangeFatherDialogOpen, setIsChangeFatherDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isHistoryDialogOpen, setIsHistoryDialogOpen] = useState(false);
  const [transferHistory, setTransferHistory] = useState<any[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [selectedChild, setSelectedChild] = useState<Child | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { t } = useTranslation();

  const handleViewHistory = async (child: Child) => {
    setSelectedChild(child);
    setIsHistoryDialogOpen(true);
    setHistoryLoading(true);
    try {
      const response = await fetchFatherTransfersByChild(child.id);
      const data = (response as any)?.data;
      setTransferHistory(Array.isArray(data) ? data : []);
    } catch (err) {
      setTransferHistory([]);
    } finally {
      setHistoryLoading(false);
    }
  };

  const [formState, setFormState] = useState({
    firstName: "",
    middleName: "",
    lastName: "",
    phoneNumber: "",
    dateOfBirth: "",
    gender: "",
    fatherId: "",
  });

  const [changeFatherState, setChangeFatherState] = useState({
    newFatherId: "",
    reason: "",
  });

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [childrenData, fathersData] = await Promise.all([
        fetchChildren(),
        fetchFathersForDropdown(),
      ]);
      
      console.log('Children Data:', childrenData);
      console.log('Fathers Data:', fathersData);
      
      // Handle paginated response for children
      let childrenArray = [];
      if (childrenData) {
        if (Array.isArray(childrenData)) {
          childrenArray = childrenData;
        } else if (childrenData.content && Array.isArray(childrenData.content)) {
          childrenArray = childrenData.content;
        } else if (typeof childrenData === 'object' && childrenData !== null) {
          // Try to find any array property
          const possibleArrays = Object.values(childrenData).filter(val => Array.isArray(val));
          if (possibleArrays.length > 0) {
            childrenArray = possibleArrays[0];
          }
        }
      }
      
      // Handle paginated response for fathers
      let fathersArray = [];
      if (fathersData) {
        if (Array.isArray(fathersData)) {
          fathersArray = fathersData;
        } else if (fathersData.content && Array.isArray(fathersData.content)) {
          fathersArray = fathersData.content;
        } else if (typeof fathersData === 'object' && fathersData !== null) {
          // Try to find any array property
          const possibleArrays = Object.values(fathersData).filter(val => Array.isArray(val));
          if (possibleArrays.length > 0) {
            fathersArray = possibleArrays[0];
          }
        }
      }
      
      console.log('Processed Children:', childrenArray);
      console.log('Processed Fathers:', fathersArray);
      
      setChildren(childrenArray);
      setFathers(fathersArray);
    } catch (err: any) {
      console.error('Error loading data:', err);
      setError("Failed to load data. " + err.message);
      setChildren([]);
      setFathers([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const filteredChildren = useMemo(() => {
    if (!Array.isArray(children)) {
      return [];
    }
    
    const query = searchQuery.toLowerCase().trim();
    if (!query) {
      return children;
    }
    
    return children.filter((child) => {
      const fullName = `${child.firstName} ${child.middleName || ''} ${child.lastName}`.toLowerCase();
      const phone = child.phoneNumber?.toLowerCase() || '';
      
      return fullName.includes(query) || phone.includes(query);
    });
  }, [children, searchQuery]);

  const columns: ColumnDef<Child>[] = [
    {
      accessorKey: "fullName",
      header: t("Child Name"),
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <UserRound className="h-5 w-5 text-primary" />
          </div>
          <div>
            <div className="font-semibold">
              {row.original.fullName}
            </div>
            
          </div>
        </div>
      ),
    },
    {
      accessorKey: "gender",
      header: t("Gender"),
      cell: ({ row }) => (
        <Badge variant="outline">
          {row.original.gender === "MALE" ? "Male" : row.original.gender === "FEMALE" ? "Female" : row.original.gender}
        </Badge>
      ),
    },
    {
      accessorKey: "dateOfBirth",
      header: t("Date of Birth"),
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Calendar className="h-3 w-3 text-muted-foreground" />
          <span className="text-sm">
            {row.original.dateOfBirth ? new Date(row.original.dateOfBirth).toLocaleDateString() : '-'}
          </span>
        </div>
      ),
    },
    {
      accessorKey: "phoneNumber",
      header: t("Phone"),
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Phone className="h-3 w-3 text-muted-foreground" />
          <span className="text-sm">{row.original.phoneNumber || "-"}</span>
        </div>
      ),
    },
    {
      accessorKey: "fatherName",
      header: t("Father"),
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <User className="h-3 w-3 text-muted-foreground" />
          <span className="text-sm">
            {row.original.fatherName || (row.original.fatherId ? `Father ID: ${row.original.fatherId}` : 'No Father')}
          </span>
        </div>
      ),
    },
    {
      id: "actions",
      cell: ({ row }) => (
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="ghost"
            title={t("Change Father")}
            onClick={() => {
              setSelectedChild(row.original);
              setChangeFatherState({ newFatherId: "", reason: "" });
              setIsChangeFatherDialogOpen(true);
            }}
          >
            <GitBranch className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            title={t("Transfer History")}
            onClick={() => handleViewHistory(row.original)}
          >
            <History className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            title={t("Record Payment")}
            onClick={() => router.push(`/payments?childId=${row.original.id}`)}
          >
            <Banknote className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            title={t("Generate Certificate")}
            onClick={() => router.push(`/certificates?childId=${row.original.id}`)}
          >
            <FileText className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="text-red-600 hover:text-red-700 hover:bg-red-50"
            onClick={() => {
              setSelectedChild(row.original);
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
    setFormState({
      firstName: "",
      middleName: "",
      lastName: "",
      phoneNumber: "",
      dateOfBirth: "",
      gender: "",
      fatherId: "",
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!formState.firstName || !formState.lastName || !formState.dateOfBirth || !formState.gender || !formState.fatherId) {
      setAlert({ type: "error", message: "Please fill all required fields" });
      return;
    }

    setIsSubmitting(true);
    setAlert(null);

    try {
      await createChild(formState);
      setAlert({ type: "success", message: "Child registered successfully!" });
      await loadData();
      setIsDialogOpen(false);
      setTimeout(() => setAlert(null), 3000);
    } catch (err: any) {
      setAlert({ type: "error", message: err.message || "Operation failed" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChangeFather = async () => {
    if (!selectedChild || !changeFatherState.newFatherId || !changeFatherState.reason) {
      setAlert({ type: "error", message: "Please select a new father and provide a reason" });
      return;
    }

    setIsSubmitting(true);
    setAlert(null);

    try {
      await changeFather(selectedChild.id, changeFatherState.newFatherId, changeFatherState.reason);
      setAlert({ type: "success", message: "Father changed successfully!" });
      await loadData();
      setIsChangeFatherDialogOpen(false);
      setTimeout(() => setAlert(null), 3000);
    } catch (err: any) {
      setAlert({ type: "error", message: err.message || "Operation failed" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedChild) return;

    setIsSubmitting(true);
    try {
      await deleteChild(selectedChild.id);
      setAlert({ type: "success", message: "Child deleted successfully!" });
      await loadData();
      setTimeout(() => setAlert(null), 3000);
    } catch (err: any) {
      setAlert({ type: "error", message: err.message || "Delete failed" });
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
            <h1 className="text-3xl font-bold">{t("Children")}</h1>
            <p className="text-muted-foreground">{t("Manage children and their father assignments")}</p>
          </div>
          <Button onClick={handleAdd} size="lg">
            <Plus className="h-5 w-5 mr-2" /> {t("Register Child")}
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
              placeholder={t("Search by name or phone...")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button variant="outline" size="icon" onClick={loadData} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <DataTable columns={columns} data={filteredChildren} />
        )}

        {/* Add Child Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle className="text-2xl">{t("Register New Child")}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>{t("First Name")} *</Label>
                  <Input
                    value={formState.firstName}
                    onChange={(e) => setFormState({ ...formState, firstName: e.target.value })}
                    placeholder="First name"
                  />
                </div>
                <div>
                  <Label>{t("Middle Name")}</Label>
                  <Input
                    value={formState.middleName}
                    onChange={(e) => setFormState({ ...formState, middleName: e.target.value })}
                    placeholder="Middle name"
                  />
                </div>
              </div>
              <div>
                <Label>{t("Last Name")} *</Label>
                <Input
                  value={formState.lastName}
                  onChange={(e) => setFormState({ ...formState, lastName: e.target.value })}
                  placeholder="Last name"
                />
              </div>
              <div>
                <Label>{t("Phone Number")}</Label>
                <Input
                  type="tel"
                  value={formState.phoneNumber}
                  onChange={(e) => setFormState({ ...formState, phoneNumber: e.target.value })}
                  placeholder="Phone number"
                />
              </div>
              <div>
                <Label>{t("Date of Birth")} *</Label>
                <Input
                  type="date"
                  value={formState.dateOfBirth}
                  onChange={(e) => setFormState({ ...formState, dateOfBirth: e.target.value })}
                />
              </div>
              <div>
                <Label>{t("Gender")} *</Label>
                <Select
                  value={formState.gender}
                  onValueChange={(v) => setFormState({ ...formState, gender: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select gender" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MALE">Male</SelectItem>
                    <SelectItem value="FEMALE">Female</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>{t("Father")} *</Label>
                <Select
                  value={formState.fatherId}
                  onValueChange={(v) => setFormState({ ...formState, fatherId: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select father" />
                  </SelectTrigger>
                  <SelectContent>
                    {fathers && fathers.length > 0 ? (
                      fathers.map((father) => (
                        <SelectItem key={father.id} value={father.id}>
                          {father.firstName} {father.middleName || ''} {father.lastName}
                          {father.churchName ? ` - ${father.churchName}` : ''}
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="no-fathers" disabled className="text-muted-foreground">
                        No fathers available
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)} disabled={isSubmitting}>
                {t("Cancel")}
              </Button>
              <Button onClick={handleSubmit} disabled={isSubmitting}>
                {isSubmitting ? t("Saving...") : t("Register")}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Change Father Dialog */}
        <Dialog open={isChangeFatherDialogOpen} onOpenChange={setIsChangeFatherDialogOpen}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>{t("Change Father")}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <Label>{t("Current Child")}</Label>
                <Input
                  value={selectedChild ? `${selectedChild.firstName} ${selectedChild.lastName}` : ""}
                  disabled
                />
              </div>
              <div>
                <Label>{t("New Father")} *</Label>
                <Select
                  value={changeFatherState.newFatherId}
                  onValueChange={(v) => setChangeFatherState({ ...changeFatherState, newFatherId: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select new father" />
                  </SelectTrigger>
                  <SelectContent>
                    {fathers && fathers.length > 0 ? (
                      fathers.map((father) => (
                        <SelectItem key={father.id} value={father.id}>
                          {father.firstName} {father.middleName || ''} {father.lastName}
                          {father.churchName ? ` - ${father.churchName}` : ''}
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="no-fathers" disabled className="text-muted-foreground">
                        No fathers available
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>{t("Reason")} *</Label>
                <Input
                  value={changeFatherState.reason}
                  onChange={(e) => setChangeFatherState({ ...changeFatherState, reason: e.target.value })}
                  placeholder="Reason for changing father"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsChangeFatherDialogOpen(false)} disabled={isSubmitting}>
                {t("Cancel")}
              </Button>
              <Button onClick={handleChangeFather} disabled={isSubmitting}>
                {isSubmitting ? t("Changing...") : t("Change Father")}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Transfer History Dialog */}
        <Dialog open={isHistoryDialogOpen} onOpenChange={setIsHistoryDialogOpen}>
          <DialogContent className="sm:max-w-lg max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <History className="h-5 w-5 text-primary" /> {t("Father Transfer History")}
              </DialogTitle>
            </DialogHeader>
            <p className="text-sm text-muted-foreground">
              {t("For")} <strong>{selectedChild?.fullName || selectedChild?.firstName}</strong>
            </p>
            {historyLoading ? (
              <div className="flex justify-center py-8">
                <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : transferHistory.length === 0 ? (
              <div className="text-center text-muted-foreground py-8 text-sm">
                {t("No transfer history recorded for this child.")}
              </div>
            ) : (
              <div className="space-y-3">
                {transferHistory.map((tr: any, idx: number) => (
                  <div key={tr.id || idx} className="bg-muted p-3 rounded-lg text-sm space-y-1">
                    <p><strong>{t("Reason")}:</strong> {tr.reason || "-"}</p>
                    <p><strong>{t("New Father ID")}:</strong> {tr.newFatherId || "-"}</p>
                    {tr.transferDate && (
                      <p><strong>{t("Date")}:</strong> {new Date(tr.transferDate).toLocaleString()}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
            <DialogFooter>
              <Button onClick={() => setIsHistoryDialogOpen(false)}>{t("Close")}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t("Delete Child?")}</DialogTitle>
            </DialogHeader>
            <p className="text-muted-foreground">
              {t("Are you sure you want to delete")} <strong>{selectedChild?.firstName} {selectedChild?.lastName}</strong>?
              {t("This action cannot be undone.")}
            </p>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
                {t("Cancel")}
              </Button>
              <Button variant="destructive" onClick={handleDelete} disabled={isSubmitting}>
                {isSubmitting ? t("Deleting...") : t("Delete")}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
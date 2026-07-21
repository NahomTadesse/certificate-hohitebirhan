"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { Users, Search, RefreshCw, AlertCircle, CheckCircle, XCircle, Edit } from "lucide-react";

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
  fetchAllUsersPaginated,
  updateUser,
  AdminUser,
  UserRole,
  UserStatus,
} from "@/services/userManagementService";
import { useTranslation } from "react-i18next";

const ROLES: UserRole[] = [
  "USER",
  "Super_Administrator",
  "Service_Center_Agent",
  "Financial_Institution",
  "MNO",
  "Agent",
  "Customer",
  "AUTHOR",
  "STORE",
  "FATHER",
  "CHILD",
  "ADMIN",
];

const STATUSES: UserStatus[] = ["ACTIVE", "INACTIVE", "PENDING_APPROVAL", "BLOCKED", "LOGGED_OUT", "PENDING"];

export default function UsersManagement() {
  const { t } = useTranslation();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [alert, setAlert] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formState, setFormState] = useState<{
    firstName: string;
    lastName: string;
    phoneNumber: string;
    role: UserRole;
    status: UserStatus;
  }>({ firstName: "", lastName: "", phoneNumber: "", role: "USER", status: "ACTIVE" });

  const loadUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchAllUsersPaginated(page, 10);
      setUsers(data.content || []);
      setTotalPages(data.totalPages || 0);
    } catch (err: any) {
      setError("Failed to load users. " + err.message);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const filteredUsers = useMemo(() => {
    return users.filter(
      (u) =>
        u.userName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.firstname?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.lastname?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [users, searchQuery]);

  const columns: ColumnDef<AdminUser>[] = [
    {
      accessorKey: "userName",
      header: t("User"),
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Users className="h-5 w-5 text-primary" />
          </div>
          <div>
            <div className="font-semibold">
              {row.original.firstname || row.original.lastname
                ? `${row.original.firstname || ""} ${row.original.lastname || ""}`.trim()
                : row.original.userName}
            </div>
            <div className="text-sm text-muted-foreground">{row.original.email || "-"}</div>
          </div>
        </div>
      ),
    },
    {
      accessorKey: "phoneNumber",
      header: t("Phone"),
      cell: ({ row }) => <span className="text-sm">{row.original.phoneNumber || "-"}</span>,
    },
    {
      accessorKey: "role",
      header: t("Role"),
      cell: ({ row }) => <Badge variant="outline">{row.original.role}</Badge>,
    },
    {
      accessorKey: "createdDate",
      header: t("Created"),
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">
          {row.original.createdDate ? new Date(row.original.createdDate).toLocaleDateString() : "-"}
        </span>
      ),
    },
    {
      id: "actions",
      cell: ({ row }) => (
        <Button size="sm" variant="ghost" onClick={() => handleEdit(row.original)}>
          <Edit className="h-4 w-4" />
        </Button>
      ),
    },
  ];

  const handleEdit = (user: AdminUser) => {
    setSelectedUser(user);
    setFormState({
      firstName: user.firstname || "",
      lastName: user.lastname || "",
      phoneNumber: user.phoneNumber || "",
      role: (user.role as UserRole) || "USER",
      status: "ACTIVE",
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!selectedUser?.uuid) return;
    setIsSubmitting(true);
    try {
      await updateUser(selectedUser.uuid, formState);
      setAlert({ type: "success", message: "User updated successfully!" });
      await loadUsers();
      setIsDialogOpen(false);
      setTimeout(() => setAlert(null), 3000);
    } catch (err: any) {
      setAlert({ type: "error", message: err.message || "Update failed" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Users className="h-7 w-7" /> {t("Users")}
            </h1>
            <p className="text-muted-foreground">{t("Manage system users, roles, and statuses")}</p>
          </div>
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
              placeholder={t("Search by name, username, or email...")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button variant="outline" size="icon" onClick={loadUsers} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            <DataTable columns={columns} data={filteredUsers} />
            <div className="flex justify-between items-center pt-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page === 0}
                onClick={() => setPage((p) => Math.max(0, p - 1))}
              >
                {t("Previous")}
              </Button>
              <span className="text-sm text-muted-foreground">
                {t("Page")} {page + 1} {t("of")} {Math.max(totalPages, 1)}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={page + 1 >= totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                {t("Next")}
              </Button>
            </div>
          </>
        )}

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle className="text-2xl">{t("Edit User")}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>{t("First Name")}</Label>
                  <Input
                    value={formState.firstName}
                    onChange={(e) => setFormState({ ...formState, firstName: e.target.value })}
                  />
                </div>
                <div>
                  <Label>{t("Last Name")}</Label>
                  <Input
                    value={formState.lastName}
                    onChange={(e) => setFormState({ ...formState, lastName: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <Label>{t("Phone Number")}</Label>
                <Input
                  value={formState.phoneNumber}
                  onChange={(e) => setFormState({ ...formState, phoneNumber: e.target.value })}
                />
              </div>
              <div>
                <Label>{t("Role")}</Label>
                <Select value={formState.role} onValueChange={(v) => setFormState({ ...formState, role: v as UserRole })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ROLES.map((r) => (
                      <SelectItem key={r} value={r}>
                        {r}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>{t("Status")}</Label>
                <Select
                  value={formState.status}
                  onValueChange={(v) => setFormState({ ...formState, status: v as UserStatus })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUSES.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)} disabled={isSubmitting}>
                {t("Cancel")}
              </Button>
              <Button onClick={handleSubmit} disabled={isSubmitting}>
                {isSubmitting ? t("Saving...") : t("Update")}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}

"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { toast } from "sonner";
import { Users, Search, RefreshCw, AlertCircle, CheckCircle, XCircle, Edit, Plus, Power } from "lucide-react";
import PhoneInput from "@/components/PhoneInput";
import { getPhoneValidationError } from "@/utils/phone";

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
  createUser,
  setUserStatus,
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
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formState, setFormState] = useState<{
    firstName: string;
    middleName: string;
    lastName: string;
    phoneNumber: string;
    role: UserRole;
    status: UserStatus;
    email: string;
    userName: string;
    password: string;
  }>({
    firstName: "",
    middleName: "",
    lastName: "",
    phoneNumber: "",
    role: "USER",
    status: "ACTIVE",
    email: "",
    userName: "",
    password: "",
  });
  const [togglingUuid, setTogglingUuid] = useState<string | null>(null);

  const loadUsers = useCallback(async (search?: string) => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchAllUsersPaginated(page, 10, undefined, search);
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

  // Debounce the search box, then ask the backend to filter the list
  // (a local filter below still applies as a fallback in case the API
  // doesn't yet honor the `search` query param).
  const isFirstSearchRender = useRef(true);
  useEffect(() => {
    if (isFirstSearchRender.current) {
      isFirstSearchRender.current = false;
      return;
    }
    const handle = setTimeout(() => {
      loadUsers(searchQuery);
    }, 400);
    return () => clearTimeout(handle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery]);

  const filteredUsers = useMemo(() => {
    const query = searchQuery.toLowerCase();
    return users.filter(
      (u) =>
        (u.userName || "").toLowerCase().includes(query) ||
        (u.email || "").toLowerCase().includes(query) ||
        (u.firstname || "").toLowerCase().includes(query) ||
        (u.lastname || "").toLowerCase().includes(query)
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
      accessorKey: "status",
      header: t("Status"),
      cell: ({ row }) => {
        const status = row.original.status || "ACTIVE";
        const isActive = status === "ACTIVE";
        return (
          <Badge variant={isActive ? "default" : "outline"} className={isActive ? "" : "text-muted-foreground"}>
            {t(status)}
          </Badge>
        );
      },
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const isActive = (row.original.status || "ACTIVE") === "ACTIVE";
        const uuid = row.original.uuid;
        return (
          <div className="flex items-center gap-1">
            <Button size="sm" variant="ghost" onClick={() => handleEdit(row.original)}>
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              disabled={!uuid || togglingUuid === uuid}
              title={isActive ? t("Disable user") : t("Enable user")}
              onClick={() => handleToggleStatus(row.original)}
            >
              <Power className={`h-4 w-4 ${isActive ? "text-green-600" : "text-muted-foreground"}`} />
            </Button>
          </div>
        );
      },
    },
  ];

  const handleToggleStatus = async (user: AdminUser) => {
    if (!user.uuid) return;
    const nextStatus: UserStatus = (user.status || "ACTIVE") === "ACTIVE" ? "BLOCKED" : "ACTIVE";
    setTogglingUuid(user.uuid);
    try {
      await setUserStatus(user.uuid, nextStatus);
      toast.success(nextStatus === "ACTIVE" ? "User enabled" : "User disabled");
      await loadUsers(searchQuery);
    } catch (err: any) {
      toast.error(err.message || "Failed to update status");
    } finally {
      setTogglingUuid(null);
    }
  };

  const handleEdit = (user: AdminUser) => {
    setSelectedUser(user);
    setFormState({
      firstName: user.firstname || "",
      middleName: user.middlename || "",
      lastName: user.lastname || "",
      phoneNumber: user.phoneNumber || "",
      role: (user.role as UserRole) || "USER",
      status: user.status || "ACTIVE",
      email: user.email || "",
      userName: user.userName || "",
      password: "",
    });
    setIsDialogOpen(true);
  };

  const handleAddUser = () => {
    setSelectedUser(null);
    setFormState({
      firstName: "",
      middleName: "",
      lastName: "",
      phoneNumber: "",
      role: "USER",
      status: "ACTIVE",
      email: "",
      userName: "",
      password: "",
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = async () => {
    const phoneError = getPhoneValidationError(formState.phoneNumber);
    if (phoneError) {
      toast.error(phoneError);
      return;
    }
    setIsSubmitting(true);
    try {
      if (selectedUser?.uuid) {
        await updateUser(selectedUser.uuid, {
          firstName: formState.firstName,
          middleName: formState.middleName,
          lastName: formState.lastName,
          phoneNumber: formState.phoneNumber,
          role: formState.role,
          status: formState.status,
        });
        toast.success("User updated successfully!");
      } else {
        if (!formState.userName || !formState.password) {
          toast.error("Username and password are required");
          setIsSubmitting(false);
          return;
        }
        await createUser({
          firstName: formState.firstName,
          middleName: formState.middleName,
          lastName: formState.lastName,
          email: formState.email,
          phoneNumber: formState.phoneNumber,
          userName: formState.userName,
          role: formState.role,
          status: formState.status,
          password: formState.password,
        });
        toast.success("User created successfully!");
      }
      await loadUsers();
      setIsDialogOpen(false);
    } catch (err: any) {
      toast.error(err.message || "Operation failed");
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
          <Button onClick={handleAddUser} size="lg">
            <Plus className="h-5 w-5 mr-2" /> {t("Add User")}
          </Button>
        </div>

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
          <Button variant="outline" size="icon" onClick={() => loadUsers()} disabled={loading}>
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
              <DialogTitle className="text-2xl">
                {selectedUser ? t("Edit User") : t("Add New User")}
              </DialogTitle>
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
                  <Label>{t("Middle Name")}</Label>
                  <Input
                    value={formState.middleName}
                    onChange={(e) => setFormState({ ...formState, middleName: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <Label>{t("Last Name")}</Label>
                <Input
                  value={formState.lastName}
                  onChange={(e) => setFormState({ ...formState, lastName: e.target.value })}
                />
              </div>
              {!selectedUser && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>{t("Username")} *</Label>
                    <Input
                      value={formState.userName}
                      onChange={(e) => setFormState({ ...formState, userName: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>{t("Email")}</Label>
                    <Input
                      type="email"
                      value={formState.email}
                      onChange={(e) => setFormState({ ...formState, email: e.target.value })}
                    />
                  </div>
                </div>
              )}
              <PhoneInput
                label={t("Phone Number")}
                value={formState.phoneNumber}
                onChange={(v) => setFormState({ ...formState, phoneNumber: v })}
              />
              {!selectedUser && (
                <div>
                  <Label>{t("Password")} *</Label>
                  <Input
                    type="password"
                    value={formState.password}
                    onChange={(e) => setFormState({ ...formState, password: e.target.value })}
                  />
                </div>
              )}
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
                {isSubmitting
                  ? t("Saving...")
                  : selectedUser
                  ? t("Update")
                  : t("Create")}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}



"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import {
  Users,
  RefreshCw,
  Plus,
  Edit,
  Eye,
  Search,
  Filter,
  Mail,
  Phone,
  Shield,
  AlertCircle,
  Loader2,
  Eye as EyeIcon,
  EyeOff,
  Lock,
  MoreVertical,
  UserX,
  CreditCard,
  Trash2,
  CheckCircle,
  XCircle,
  Calendar,
  Building,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";
import { format } from "date-fns";

import { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/ui/DataTable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

import DashboardLayout from "../dashboard/layout";
import {
  fetchUsers,
  createUser,
  updateUser,
  deleteUser,
  assignNFCCard,
  revokeNFCCard,
  fetchUserById,
  fetchOrganizationsForDropdown,
  User,
  UserRole,
  AssignNFCPayload,
} from "../../services/userService";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

interface Organization {
  id: string;
  name: string;
  code: string;
  isActive: boolean;
}

interface PaginationMeta {
  page: number;
  perPage: number;
  total: number;
  pages: number;
}

interface UsersResponse {
  data: User[];
  meta: PaginationMeta;
  success: boolean;
}

const roleColors: Record<string, string> = {
  super_admin: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
  ADMIN: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  driver: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
 
  org_admin: "bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200",

  passenger: "bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200",
};

const statusColors: Record<string, string> = {
  true: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  false: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300",
};

export default function UserManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingOrgs, setLoadingOrgs] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isNFCDialogOpen, setIsNFCDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [formMode, setFormMode] = useState<"create" | "edit">("create");
  const [submitting, setSubmitting] = useState(false);
  const { t } = useTranslation();
  const [showPassword, setShowPassword] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedOrgFilter, setSelectedOrgFilter] = useState<string>("all");
  
  // Pagination state - using 0-based page indexing
  const [pagination, setPagination] = useState({
    page: 0, // 0-based page index
    perPage: 10,
  });
  const [meta, setMeta] = useState<PaginationMeta>({
    page: 0,
    perPage: 10,
    total: 0,
    pages: 0,
  });

  const [formState, setFormState] = useState({
    organization_id: "",
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    password: "",
    role: "DRIVER" as string,
  });

  const [nfcFormState, setNfcFormState] = useState({
    cardUid: "",
    expires_at: "",
  });

  // Load organizations for filter dropdown
  useEffect(() => {
    const loadOrganizations = async () => {
      try {
        const orgs = await fetchOrganizationsForDropdown();
        setOrganizations(orgs.filter(org => org.isActive));
      } catch (error) {
        console.error("Failed to load organizations:", error);
      } finally {
        setLoadingOrgs(false);
      }
    };
    loadOrganizations();
  }, []);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetchUsers(
        pagination.page, 
        pagination.perPage, 
        selectedOrgFilter !== "all" ? selectedOrgFilter : undefined
      ) as UsersResponse;
      
      setUsers(response.data || []);
      setMeta(response.meta || {
        page: pagination.page,
        perPage: pagination.perPage,
        total: 0,
        pages: 0,
      });
    } catch (err: any) {
      setError("Failed to load users. Please try again.");
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.perPage, selectedOrgFilter]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const filteredUsers = useMemo(() => {
    // Client-side filtering for search, role, and status
    return users.filter((u) => {
      const fullName = `${u.firstName || ''} ${u.lastName || ''}`.toLowerCase();
      const matchesSearch =
        searchQuery === "" ||
        fullName.includes(searchQuery.toLowerCase()) ||
        (u.email && u.email.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (u.phone && u.phone.includes(searchQuery));

      const matchesRole = roleFilter === "all" || u.role === roleFilter.toUpperCase();
      const matchesStatus = statusFilter === "all" || 
        (statusFilter === "active" && u.isActive === true) ||
        (statusFilter === "inactive" && u.isActive === false);
      
      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [users, searchQuery, roleFilter, statusFilter]);

  const handleViewUser = async (user: User) => {
    try {
      const response = await fetchUserById(user.id);
      setSelectedUser(response.data);
      setIsViewOpen(true);
    } catch (err: any) {
      toast.error("Failed to load user details");
    }
  };

  const handleEdit = (user: User) => {
    setFormMode("edit");
    setFormState({
      organization_id: user.organizationId || "",
      first_name: user.firstName || "",
      last_name: user.lastName || "",
      email: user.email || "",
      phone: user.phone || "",
      password: "",
      role: user.role || "DRIVER",
    });
    setSelectedUser(user);
    setShowPassword(false);
    setIsFormOpen(true);
  };

  const handleAssignNFC = (user: User) => {
    setSelectedUser(user);
    setNfcFormState({
      cardUid: "",
      expires_at: format(new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), "yyyy-MM-dd'T'HH:mm:ss'Z'"),
    });
    setIsNFCDialogOpen(true);
  };

  const handleRevokeNFC = async (user: User) => {
    if (!confirm(`Revoke NFC card for ${user.firstName} ${user.lastName}?`)) return;
    
    try {
      await revokeNFCCard(user.id);
      toast.success("NFC card revoked successfully");
      loadUsers();
    } catch (err: any) {
      toast.error(err.message || "Failed to revoke NFC card");
    }
  };

  const handleDeleteUser = async (user: User) => {
    setSelectedUser(user);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!selectedUser) return;
    
    setSubmitting(true);
    try {
      await deleteUser(selectedUser.id);
      toast.success("User deleted successfully");
      loadUsers();
      setIsDeleteDialogOpen(false);
      setSelectedUser(null);
    } catch (err: any) {
      toast.error(err.message || "Failed to delete user");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitNFC = async () => {
    if (!nfcFormState.cardUid) {
      toast.error("Card UID is required");
      return;
    }
    if (!nfcFormState.expires_at) {
      toast.error("Expiration date is required");
      return;
    }

    setSubmitting(true);
    try {
      await assignNFCCard(selectedUser!.id, nfcFormState);
      toast.success("NFC card assigned successfully");
      setIsNFCDialogOpen(false);
      loadUsers();
    } catch (err: any) {
      toast.error(err.message || "Failed to assign NFC card");
    } finally {
      setSubmitting(false);
    }
  };

  // Pagination handlers with 0-based indexing
  const goToPage = (page: number) => {
    if (page >= 0 && page < meta.pages) {
      setPagination(prev => ({ ...prev, page }));
    }
  };

  const goToFirstPage = () => goToPage(0);
  const goToLastPage = () => goToPage(meta.pages - 1);
  const goToNextPage = () => goToPage(pagination.page + 1);
  const goToPreviousPage = () => goToPage(pagination.page - 1);

  const handlePerPageChange = (value: string) => {
    const newPerPage = parseInt(value, 10);
    setPagination({ page: 0, perPage: newPerPage }); // Reset to first page (0) when changing per page
  };

  const columns: ColumnDef<User>[] = [
    {
      accessorKey: "fullName",
      header: t("User"),
      cell: ({ row }) => {
        const user = row.original;
        const initials = `${(user.firstName?.[0] || '')}${(user.lastName?.[0] || '')}`.toUpperCase();
        return (
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarFallback className="bg-gradient-to-br from-teal-500 to-cyan-600 text-white font-bold">
                {initials || "U"}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-semibold">{user.firstName} {user.lastName}</p>
              <p className="text-sm text-muted-foreground">{user.email}</p>
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: "phone",
      header: t("Phone"),
      cell: ({ row }) => (
        <div className="flex items-center gap-2 text-sm">
          <Phone className="h-4 w-4 text-muted-foreground" />
          {row.original.phone || "-"}
        </div>
      ),
    },
    {
      accessorKey: "role",
      header: t("Role"),
      cell: ({ row }) => (
        <Badge className={cn("font-medium", roleColors[row.original.role] || "bg-gray-100")}>
          <Shield className="h-3.5 w-3.5 mr-1" />
          {row.original.role?.replace(/_/g, " ").toUpperCase() || "UNKNOWN"}
        </Badge>
      ),
    },
    {
      accessorKey: "isActive",
      header: t("Status"),
      cell: ({ row }) => (
        <Badge className={cn("font-medium", statusColors[String(row.original.isActive)])}>
          {row.original.isActive ? "ACTIVE" : "INACTIVE"}
        </Badge>
      ),
    },
    {
      accessorKey: "createdAt",
      header: t("Created"),
      cell: ({ row }) => format(new Date(row.original.createdAt), "MMM dd, yyyy"),
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const user = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => handleViewUser(user)}>
                <Eye className="mr-2 h-4 w-4" />
                View Details
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleEdit(user)}>
                <Edit className="mr-2 h-4 w-4" />
                Edit User
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => handleAssignNFC(user)}>
                <CreditCard className="mr-2 h-4 w-4" />
                Assign NFC Card
              </DropdownMenuItem>
              {user.nfc_card && (
                <DropdownMenuItem onClick={() => handleRevokeNFC(user)}>
                  <XCircle className="mr-2 h-4 w-4" />
                  Revoke NFC Card
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={() => handleDeleteUser(user)}
                className="text-red-600 focus:text-red-600"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete User
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  const handleAdd = () => {
    setFormMode("create");
    setFormState({
      organization_id: organizations[0]?.id || "",
      first_name: "",
      last_name: "",
      email: "",
      phone: "",
      password: "",
      role: "DRIVER",
    });
    setShowPassword(false);
    setIsFormOpen(true);
  };

  const handleSubmit = async () => {
    const missing = [];
    if (!formState.organization_id) missing.push("Organization");
    if (!formState.first_name) missing.push("First Name");
    if (!formState.last_name) missing.push("Last Name");
    if (!formState.email) missing.push("Email");
    if (!formState.phone) missing.push("Phone");
    if (formMode === "create" && !formState.password) missing.push("Password");

    if (missing.length > 0) {
      toast.error(`Please fill: ${missing.join(", ")}`);
      return;
    }

    setSubmitting(true);

    try {
      if (formMode === "create") {
        await createUser({
          organization_id: formState.organization_id,
          email: formState.email,
          password: formState.password,
          firstName: formState.first_name,
          lastName: formState.last_name,
          phone: formState.phone,
          role: formState.role as any,
        });
        toast.success("User created successfully!");
      } else if (selectedUser) {
        await updateUser(selectedUser.id, {
          firstName: formState.first_name,
          lastName: formState.last_name,
          phone: formState.phone,
          role: formState.role as any,
        });
        toast.success("User updated successfully!");
      }

      setIsFormOpen(false);
      loadUsers();
    } catch (err: any) {
      toast.error(err.message || "Failed to save user");
    } finally {
      setSubmitting(false);
    }
  };

  // Calculate display range for showing "X-Y of Z" (1-based for display)
  const startItem = users.length > 0 ? pagination.page * pagination.perPage + 1 : 0;
  const endItem = Math.min((pagination.page + 1) * pagination.perPage, meta.total);

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6" style={{ backgroundColor: "var(--background)" }}>
        {/* Header */}
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold" style={{ color: "var(--foreground)" }}>
              {t("User Management")}
            </h1>
            <p className="text-muted-foreground">{t("Manage system users and permissions")}</p>
          </div>
          <Button onClick={handleAdd} size="lg" style={{ backgroundColor: "var(--primary)", color: "var(--primary-foreground)" }}>
            <Plus className="h-5 w-5 mr-2" /> {t("Add User")}
          </Button>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search by name, email, phone..." 
              value={searchQuery} 
              onChange={(e) => setSearchQuery(e.target.value)} 
              className="pl-10"
              style={{ borderColor: "var(--border)", backgroundColor: "var(--background)" }}
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            <Select value={selectedOrgFilter} onValueChange={(value) => {
              setSelectedOrgFilter(value);
              setPagination(prev => ({ ...prev, page: 0 })); // Reset to first page (0) when filter changes
            }}>
              <SelectTrigger className="w-48">
                <Building className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Organization" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("All Organizations")}</SelectItem>
                {organizations.map((org) => (
                  <SelectItem key={org.id} value={org.id}>
                    {org.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-40">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("All Roles")}</SelectItem>
                <SelectItem value="super_admin">{t("Super Admin")}</SelectItem>
                <SelectItem value="admin">{t("Org Admin")}</SelectItem>
              
                <SelectItem value="driver">{t("Driver")}</SelectItem>
                <SelectItem value="passenger">{t("Passenger")}</SelectItem>
              
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("All")}</SelectItem>
                <SelectItem value="active">{t("Active")}</SelectItem>
                <SelectItem value="inactive">{t("Inactive")}</SelectItem>
              </SelectContent>
            </Select>

            <Button variant="outline" size="icon" onClick={loadUsers} disabled={loading}>
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            </Button>
          </div>
        </div>

        {/* User Table */}
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="h-8 w-8 animate-spin" style={{ color: "var(--primary)" }} />
          </div>
        ) : (
          <>
            <DataTable columns={columns} data={filteredUsers} />
            
            {/* Pagination Controls */}
            <div className="flex items-center justify-between px-2 py-4">
              <div className="flex items-center gap-2">
                <p className="text-sm text-muted-foreground">
                  Showing {startItem} - {endItem} of {meta.total} users
                </p>
                <Select value={pagination.perPage.toString()} onValueChange={handlePerPageChange}>
                  <SelectTrigger className="w-20 h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5">5</SelectItem>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="20">20</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={goToFirstPage}
                  disabled={pagination.page === 0 || loading}
                >
                  <ChevronsLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={goToPreviousPage}
                  disabled={pagination.page === 0 || loading}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                
                <div className="flex items-center gap-1">
                  <span className="text-sm font-medium">
                    Page {pagination.page + 1} of {meta.pages || 1}
                  </span>
                </div>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={goToNextPage}
                  disabled={pagination.page === meta.pages - 1 || meta.pages === 0 || loading}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={goToLastPage}
                  disabled={pagination.page === meta.pages - 1 || meta.pages === 0 || loading}
                >
                  <ChevronsRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </>
        )}

        {/* Create/Edit User Dialog */}
        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-2xl" style={{ color: "var(--primary)" }}>
                {formMode === "create" ? t("Create New User") : t("Edit User")}
              </DialogTitle>
            </DialogHeader>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
              {/* Left Column */}
              <div className="space-y-5">
                {formMode === "create" && (
                  <div>
                    <Label>{t("Organization")} <span className="text-red-500">*</span></Label>
                    <div className="relative">
                      <Building className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Select 
                        value={formState.organization_id} 
                        onValueChange={(v) => setFormState({ ...formState, organization_id: v })}
                      >
                        <SelectTrigger className="pl-10">
                          <SelectValue placeholder="Select organization" />
                        </SelectTrigger>
                        <SelectContent>
                          {organizations.map((org) => (
                            <SelectItem key={org.id} value={org.id}>
                              {org.name} ({org.code})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}

                <div>
                  <Label>{t("First Name")} <span className="text-red-500">*</span></Label>
                  <Input 
                    value={formState.first_name} 
                    onChange={(e) => setFormState({ ...formState, first_name: e.target.value })} 
                    placeholder="First Name"
                    style={{ borderColor: "var(--border)", backgroundColor: "var(--background)" }}
                  />
                </div>

                <div>
                  <Label>{t("Last Name")} <span className="text-red-500">*</span></Label>
                  <Input 
                    value={formState.last_name} 
                    onChange={(e) => setFormState({ ...formState, last_name: e.target.value })} 
                    placeholder="Last Name"
                    style={{ borderColor: "var(--border)", backgroundColor: "var(--background)" }}
                  />
                </div>

                <div>
                  <Label>{t("Email")}<span className="text-red-500">*</span></Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input 
                      type="email" 
                      className="pl-10" 
                      value={formState.email} 
                      onChange={(e) => setFormState({ ...formState, email: e.target.value })} 
                      placeholder="name@example.com"
                      style={{ borderColor: "var(--border)", backgroundColor: "var(--background)" }}
                    />
                  </div>
                </div>
              </div>

              {/* Right Column */}
              <div className="space-y-5">
                <div>
                  <Label>{t("Phone Number")} <span className="text-red-500">*</span></Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input 
                      className="pl-10" 
                      value={formState.phone} 
                      onChange={(e) => setFormState({ ...formState, phone: e.target.value })} 
                      placeholder="+251911234567"
                      style={{ borderColor: "var(--border)", backgroundColor: "var(--background)" }}
                    />
                  </div>
                </div>

                <div>
                  <Label>{t("Role")} <span className="text-red-500">*</span></Label>
                  <Select value={formState.role} onValueChange={(v) => setFormState({ ...formState, role: v })}>
                    <SelectTrigger style={{ borderColor: "var(--border)", backgroundColor: "var(--background)" }}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="SUPER_ADMIN">{t("Super Admin")}</SelectItem>
                      <SelectItem value="ADMIN">{t("Org Admin")}</SelectItem>
                      <SelectItem value="CARRIER_ADMIN">{t("Carrier Admin")}</SelectItem>
                      <SelectItem value="FLEET_MANAGER">{t("Fleet Manager")}</SelectItem>
                      <SelectItem value="DISPATCHER">{t("Dispatcher")}</SelectItem>
                      <SelectItem value="DRIVER">{t("Driver")}</SelectItem>
                      <SelectItem value="PASSENGER">{t("Passenger")}</SelectItem>
                      <SelectItem value="SHIPPER">{t("Shipper")}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {formMode === "create" && (
                  <div>
                    <Label>{t("Password")} <span className="text-red-500">*</span></Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        type={showPassword ? "text" : "password"}
                        className="pl-10 pr-10"
                        value={formState.password}
                        onChange={(e) => setFormState({ ...formState, password: e.target.value })}
                        placeholder="••••••••"
                        style={{ borderColor: "var(--border)", backgroundColor: "var(--background)" }}
                      />
                      <button 
                        type="button" 
                        onClick={() => setShowPassword(!showPassword)} 
                        className="absolute right-3 top-1/2 -translate-y-1/2"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4 text-muted-foreground" /> : <EyeIcon className="h-4 w-4 text-muted-foreground" />}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsFormOpen(false)} disabled={submitting}>
                {t("Cancel")}
              </Button>
              <Button onClick={handleSubmit} disabled={submitting} style={{ backgroundColor: "var(--primary)", color: "var(--primary-foreground)" }}>
                {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                {submitting ? "Saving..." : formMode === "create" ? t("Create User") : t("Update User")}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* View User Details Dialog */}
        <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="text-2xl" style={{ color: "var(--primary)" }}>
                User Details
              </DialogTitle>
            </DialogHeader>
            {selectedUser && (
              <div className="space-y-6 py-4">
                <div className="flex items-center gap-4 pb-4 border-b" style={{ borderColor: "var(--border)" }}>
                  <Avatar className="h-16 w-16">
                    <AvatarFallback className="bg-gradient-to-br from-teal-500 to-cyan-600 text-white text-xl font-bold">
                      {`${selectedUser.firstName?.[0] || ''}${selectedUser.lastName?.[0] || ''}`.toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="text-xl font-semibold">{selectedUser.firstName} {selectedUser.lastName}</h3>
                    <p className="text-muted-foreground">{selectedUser.email}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-muted-foreground">Phone</Label>
                    <p className="font-medium">{selectedUser.phone || "-"}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Role</Label>
                    <Badge className={cn("mt-1", roleColors[selectedUser.role])}>
                      {selectedUser.role?.replace(/_/g, " ").toUpperCase() || "UNKNOWN"}
                    </Badge>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Status</Label>
                    <Badge className={cn("mt-1", statusColors[String(selectedUser.isActive)])}>
                      {selectedUser.isActive ? "ACTIVE" : "INACTIVE"}
                    </Badge>
                  </div>
                  {selectedUser.pickupStop && (
                    <>
                      <div>
                        <Label className="text-muted-foreground">Pickup Stop</Label>
                        <p className="font-medium">{selectedUser.pickupStop.name}</p>
                        <p className="text-sm text-muted-foreground">{selectedUser.pickupStop.address}</p>
                      </div>
                      {selectedUser.currentRoute && (
                        <div className="col-span-2">
                          <Label className="text-muted-foreground">Current Route</Label>
                          <p className="font-medium">{selectedUser.currentRoute.routeName}</p>
                          <p className="text-sm text-muted-foreground">
                            Vehicle: {selectedUser.currentRoute.vehiclePlateNumber} | 
                            Status: {selectedUser.currentRoute.tripStatus}
                          </p>
                        </div>
                      )}
                    </>
                  )}
                </div>

                {selectedUser.nfc_card && (
                  <div className="p-4 rounded-lg" style={{ backgroundColor: "var(--muted)" }}>
                    <h4 className="font-semibold flex items-center gap-2 mb-3">
                      <CreditCard className="h-4 w-4" />
                      NFC Card Information
                    </h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-muted-foreground">Card UID</Label>
                        <p className="font-mono text-sm">{selectedUser.nfc_card.cardUid}</p>
                      </div>
                      <div>
                        <Label className="text-muted-foreground">Assigned At</Label>
                        <p>{format(new Date(selectedUser.nfc_card.assigned_at), "PPP")}</p>
                      </div>
                      <div>
                        <Label className="text-muted-foreground">Expires At</Label>
                        <p>{format(new Date(selectedUser.nfc_card.expires_at), "PPP")}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsViewOpen(false)}>Close</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Assign NFC Card Dialog */}
        <Dialog open={isNFCDialogOpen} onOpenChange={setIsNFCDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle style={{ color: "var(--primary)" }}>Assign NFC Card</DialogTitle>
              <DialogDescription>
                Assign an NFC card to {selectedUser?.firstName} {selectedUser?.lastName}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <Label>Card UID <span className="text-red-500">*</span></Label>
                <Input
                  placeholder="Enter NFC card UID"
                  value={nfcFormState.cardUid}
                  onChange={(e) => setNfcFormState({ ...nfcFormState, cardUid: e.target.value })}
                  style={{ borderColor: "var(--border)", backgroundColor: "var(--background)" }}
                />
              </div>
              <div>
                <Label>Expiration Date <span className="text-red-500">*</span></Label>
                <Input
                  type="datetime-local"
                  value={nfcFormState.expires_at.replace('Z', '').slice(0, 16)}
                  onChange={(e) => setNfcFormState({ ...nfcFormState, expires_at: new Date(e.target.value).toISOString() })}
                  style={{ borderColor: "var(--border)", backgroundColor: "var(--background)" }}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsNFCDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleSubmitNFC} disabled={submitting} style={{ backgroundColor: "var(--primary)", color: "var(--primary-foreground)" }}>
                {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Assign Card
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="text-red-600">Delete User</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete {selectedUser?.firstName} {selectedUser?.lastName}? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>Cancel</Button>
              <Button variant="destructive" onClick={confirmDelete} disabled={submitting}>
                {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Delete User
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
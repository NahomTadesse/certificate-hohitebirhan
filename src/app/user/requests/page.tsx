
'use client';

import { useState, useEffect, useCallback, useMemo } from "react";
import {
  Users,
  RefreshCw,
  Eye,
  Search,
  Phone,
  Mail,
  Shield,
  AlertCircle,
  Loader2,
  CheckCircle,
  XCircle,
  Clock,
  MoreVertical,
  User as UserIcon, // Renamed User icon
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";

import DashboardLayout from "@/app/dashboard/layout";
import {
  fetchUsers,
  updateUser,
  User, // This is your User type from userService
  UserRole,
  UserStatus,
} from "../../../services/userService";
import { useTranslation } from "react-i18next";

const roleColors: Record<UserRole, string> = {
  SUPER_ADMIN: "bg-purple-100 text-purple-800 border-purple-200",
  ADMIN: "bg-blue-100 text-blue-800 border-blue-200",
  DRIVER: "bg-green-100 text-green-800 border-green-200",
  DISPATCHER: "bg-orange-100 text-orange-800 border-orange-200",
  FLEET_MANAGER: "bg-indigo-100 text-indigo-800 border-indigo-200",
  CARRIER_ADMIN: "",
  SHIPPER: ""
};



export default function UserRequests() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isApprovalOpen, setIsApprovalOpen] = useState(false);
  const [approvalStatus, setApprovalStatus] = useState<UserStatus>("ACTIVE");
  const [submitting, setSubmitting] = useState(false);
  const [alert, setAlert] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
const { t } = useTranslation(); 
  const loadPendingUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetchUsers(0, 50, "UNDER_REVIEW"); 
      setUsers(response.content || []);
    } catch (err: any) {
      setError(t("Failed to load pending requests. Please try again."));
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPendingUsers();
  }, [loadPendingUsers]);

  const filteredUsers = useMemo(() => {
    return users.filter((u) =>
      searchQuery === "" ||
      u.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.phone.includes(searchQuery)
    );
  }, [users, searchQuery]);

  const columns: ColumnDef<User>[] = [
    {
      accessorKey: "fullName",
      header: t("User"),
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10">
            <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white">
              {row.original.name.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="font-medium text-gray-900">{row.original.fullName}</p>
            <p className="text-sm text-gray-500">{row.original.email}</p>
          </div>
        </div>
      ),
    },
    {
      accessorKey: "phone",
      header: t("Phone"),
      cell: ({ row }) => (
        <div className="flex items-center gap-2 text-gray-700">
          <Phone className="h-4 w-4 text-gray-400" />
          {row.original.phone}
        </div>
      ),
    },
    {
      accessorKey: "role",
      header: t("Requested Role"),
      cell: ({ row }) => (
        <Badge variant="outline" className={`font-medium px-3 py-1 ${roleColors[row.original.role] || "bg-gray-100"}`}>
          <Shield className="h-3 w-3 mr-2" />
          {row.original.role.replace("_", " ")}
        </Badge>
      ),
    },
    {
      accessorKey: "createdAt",
      header: t("Request Date"),
      cell: ({ row }) => (
        <div className="text-gray-700">
          <div>{format(new Date(row.original.createdAt), "MMM dd, yyyy")}</div>
          <div className="text-xs text-gray-500">
            {format(new Date(row.original.createdAt), "hh:mm a")}
          </div>
        </div>
      ),
    },

    {
      id: "actions",
      header: t("Actions"),
      cell: ({ row }) => {
        const user = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={() => { setSelectedUser(user); setIsViewOpen(true); }}>
                <Eye className="h-4 w-4 mr-2" />
                {t("View Details")}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => { setSelectedUser(user); setApprovalStatus("ACTIVE"); setIsApprovalOpen(true); }}>
                <CheckCircle className="h-4 w-4 mr-2 text-green-600" />
                {t("Approve User")}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={() => { setSelectedUser(user); setApprovalStatus("SUSPENDED"); setIsApprovalOpen(true); }}
                className="text-red-600 focus:text-red-600"
              >
                <XCircle className="h-4 w-4 mr-2" />
                {t("Reject User")}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  const handleApproveReject = async () => {
    if (!selectedUser) return;

    setSubmitting(true);
    setAlert(null);

    try {
      const updated = await updateUser(selectedUser.id, { status: approvalStatus });
      setUsers(prev => prev.filter(u => u.id !== selectedUser.id));
      setAlert({
        type: "success",
        message: `User ${approvalStatus === "ACTIVE" ? "approved" : "rejected"} successfully!`
      });
      setTimeout(() => {
        setIsApprovalOpen(false);
        setAlert(null);
      }, 2000);
    } catch (err: any) {
      console.log("tess",JSON.parse(err.message).detail)
      setAlert({ type: "error", message: JSON.parse(err.message).detail  || "Failed to update status" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        {/* Header Section */}
        <div className="flex flex-col gap-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{t("User Requests")}</h1>
              <p className="text-gray-600 mt-1">{t("Review and manage pending user registrations")}</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search users..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 w-64"
                />
              </div>
              <Button
                variant="outline"
                size="icon"
                onClick={loadPendingUsers}
                className="h-10 w-10"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              </Button>
            </div>
          </div>

    
        </div>

        {/* Alerts */}
        {error && (
          <Alert variant="destructive" >
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {alert && (
          <Alert variant={alert.type === "error" ? "destructive" : "default"} >
            <AlertDescription className="font-medium">{alert.message}</AlertDescription>
          </Alert>
        )}

        {/* Main Content */}
   
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <Skeleton className="h-10 w-10 rounded-full" />
                      <div className="space-y-2">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-3 w-24" />
                      </div>
                    </div>
                    <Skeleton className="h-8 w-8 rounded-md" />
                  </div>
                ))}
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="text-center py-12">
                <Users className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">{t("No pending requests")}</h3>
                <p className="text-gray-500">
                  {searchQuery ? t("No users match your search") : t("All user requests have been processed")}
                </p>
              </div>
            ) : (
              <DataTable 
                columns={columns} 
                data={filteredUsers}

              />
            )}
          </CardContent>
       

        {/* View Details Dialog */}
        <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="text-xl">{t("User Details")}</DialogTitle>
            </DialogHeader>
            {selectedUser && (
              <div className="space-y-6 py-2">
                <div className="flex items-center gap-4">
                  <Avatar className="h-16 w-16">
                    <AvatarFallback className="text-lg bg-gradient-to-br from-blue-500 to-purple-600">
                      {selectedUser.name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="text-lg font-semibold">{selectedUser.fullName}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className="bg-yellow-50 text-yellow-700">
                        <Clock className="h-3 w-3 mr-1" />
                        {t("PENDING REVIEW")}
                      </Badge>
                    </div>
                  </div>
                </div>

                <Separator />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <Label className="text-sm text-gray-500">{t("Contact Information")}</Label>
                      <div className="space-y-2 mt-2">
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-gray-400" />
                          <span className="text-sm">{selectedUser.email}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4 text-gray-400" />
                          <span className="text-sm">{selectedUser.phone}</span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <Label className="text-sm text-gray-500">{t("Request Information")}</Label>
                      <div className="space-y-2 mt-2">
                        <div className="flex items-center">
                          <span className="text-sm text-gray-600">{t("Request Date")}:</span>
                          <span className="text-sm font-medium">
                            {format(new Date(selectedUser.createdAt), "MMM dd, yyyy")}
                          </span>
                        </div>
                        <div className="flex items-center">
                          <span className="text-sm text-gray-600">{t("Time")}:</span>
                          <span className="text-sm font-medium">
                            {format(new Date(selectedUser.createdAt), "hh:mm a")}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <Label className="text-sm text-gray-500">{t("Requested Role")}</Label>
                      <div className="mt-2">
                        <Badge 
                          variant="outline" 
                          className={`px-3 py-2 ${roleColors[selectedUser.role as UserRole] || "bg-gray-100 text-gray-800 border-gray-200"}`}
                        >
                          <Shield className="h-4 w-4 mr-2" />
                          {selectedUser.role.replace("_", " ")}
                        </Badge>
                      </div>
                    </div>

                    <div>
                      <Label className="text-sm text-gray-500">{t("Actions")}</Label>
                      <div className="flex gap-2 mt-3">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          onClick={() => {
                            setIsViewOpen(false);
                            setSelectedUser(selectedUser);
                            setApprovalStatus("SUSPENDED");
                            setIsApprovalOpen(true);
                          }}
                        >
                          <XCircle className="h-4 w-4 mr-2" />
                          {t("Reject")}
                        </Button>
                        <Button
                          size="sm"
                          className="flex-1"
                          onClick={() => {
                            setIsViewOpen(false);
                            setSelectedUser(selectedUser);
                            setApprovalStatus("ACTIVE");
                            setIsApprovalOpen(true);
                          }}
                        >
                          <CheckCircle className="h-4 w-4 mr-2" />
                          {t("Approve")}
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Approval/Rejection Dialog */}
        <Dialog open={isApprovalOpen} onOpenChange={setIsApprovalOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                {approvalStatus === "ACTIVE" ? (
                  <CheckCircle className="h-5 w-5 text-green-600" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-600" />
                )}
                {approvalStatus === "ACTIVE" ? "Approve User" : "Reject User"}
              </DialogTitle>
            </DialogHeader>
            {selectedUser && (
              <div className="py-4">
                <p className="text-gray-600 mb-4">
                  {approvalStatus === "ACTIVE" 
                    ? t("Are you sure you want to approve this user request?")
                    : t("Are you sure you want to reject this user request?")
                  }
                </p>
                <Card className="bg-gray-50 border-gray-200">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600">
                          {selectedUser.name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{selectedUser.fullName}</p>
                        <p className="text-sm text-gray-500">{selectedUser.email}</p>
                        <Badge variant="outline" className={`mt-1 ${roleColors[selectedUser.role as UserRole]}`}>
                          {selectedUser.role.replace("_", " ")}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
            <DialogFooter className="gap-2">
              <Button
                variant="outline"
                onClick={() => setIsApprovalOpen(false)}
                disabled={submitting}
                className="flex-1"
              >
                {t("Cancel")}
              </Button>
              <Button
                variant={approvalStatus === "ACTIVE" ? "default" : "destructive"}
                onClick={handleApproveReject}
                disabled={submitting}
                className="flex-1"
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    {t("Processing...")}
                  </>
                ) : (
                  approvalStatus === "ACTIVE" ? "Confirm Approve" : "Confirm Reject"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
"use client";

import { useState, useEffect } from "react";
import {
  
  Mail,
  Phone,
  Shield,
  Calendar,
  Clock,
  Key,
  Edit,
  Building,
  CheckCircle,
  Loader2,
  Save,
  Eye,
  EyeOff,
  CreditCard,
  MapPin,
  Truck,
  PersonStanding,
  PersonStandingIcon,
  Circle,
} from "lucide-react";
import { format } from "date-fns";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import {
  fetchUserProfile,
  updateUserProfile,
  changePassword,
  type UserProfile,
} from "@/services/profileService";
import { fetchUserById, type User } from "@/services/userService";
import DashboardLayout from "../dashboard/layout";
import { cn } from "@/lib/utils";

const roleColors: Record<string, string> = {
  super_admin: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
  ADMIN: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  CARRIER_ADMIN: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200",
  FLEET_MANAGER: "bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200",
  DISPATCHER: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
  DRIVER: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  PASSENGER: "bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200",
  SHIPPER: "bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200",
};

const statusColors: Record<string, string> = {
  true: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  false: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300",
};

export default function ProfilePage() {
  const [isLoading, setIsLoading] = useState(true);
  const [profile, setProfile] = useState<User | null>(null);
  const [profileMeta, setProfileMeta] = useState<UserProfile | null>(null);
  
  // Edit Profile Modal State
  const [editProfileOpen, setEditProfileOpen] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
  });
  
  // Change Password Modal State
  const [changePasswordOpen, setChangePasswordOpen] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      setIsLoading(true);
      // First, get the user ID from the profile endpoint
      const profileResponse = await fetchUserProfile();
      setProfileMeta(profileResponse);
      
      // Then fetch full user details using the user ID
      if (profileResponse.data.userId) {
        const userDetails = await fetchUserById(profileResponse.data.userId);
        setProfile(userDetails.data);
        setProfileForm({
          firstName: userDetails.data.firstName || "",
          lastName: userDetails.data.lastName || "",
          email: userDetails.data.email || "",
          phone: userDetails.data.phone || "",
        });
      }
    } catch (error: any) {
      toast.error("Failed to load profile: " + (error.message || "Unknown error"));
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!profileForm.firstName.trim() || !profileForm.lastName.trim()) {
      toast.error("First name and last name are required");
      return;
    }

    setIsSavingProfile(true);

    try {
      const updatedProfile = await updateUserProfile({
        fullName: `${profileForm.firstName} ${profileForm.lastName}`,
        email: profileForm.email,
        phone: profileForm.phone,
      });
      
      // Refresh full user details after update
      if (profileMeta?.userId) {
        const userDetails = await fetchUserById(profileMeta.userId);
        setProfile(userDetails.data);
      }
      
      setEditProfileOpen(false);
      toast.success("Profile updated successfully");
    } catch (error: any) {
      toast.error("Failed to update profile: " + (error.message || "Unknown error"));
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!passwordForm.currentPassword || !passwordForm.newPassword) {
      toast.error("Current password and new password are required");
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error("New passwords do not match");
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      toast.error("New password must be at least 6 characters");
      return;
    }

    setIsChangingPassword(true);

    try {
      await changePassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });
      
      setPasswordForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      setChangePasswordOpen(false);
      toast.success("Password changed successfully");
    } catch (error: any) {
      toast.error("Failed to change password: " + (error.message || "Invalid current password"));
    } finally {
      setIsChangingPassword(false);
    }
  };

  const getRoleBadge = (role: string) => {
    return (
      <span className={cn("px-4 py-1.5 rounded-lg text-sm font-semibold shadow-sm", roleColors[role] || "bg-gray-100 text-gray-800")}>
        {role?.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, l => l.toUpperCase()) || "UNKNOWN"}
      </span>
    );
  };

  const getStatusBadge = (status: boolean) => {
    return (
      <span className={cn("px-4 py-1.5 rounded-lg text-sm font-semibold shadow-sm", statusColors[String(status)])}>
        {status ? "ACTIVE" : "INACTIVE"}
      </span>
    );
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "N/A";
    try {
      return format(new Date(dateString), "PPP");
    } catch {
      return "Invalid date";
    }
  };

  const getInitials = () => {
    if (!profile) return "U";
    const first = profile.firstName?.[0] || "";
    const last = profile.lastName?.[0] || "";
    return `${first}${last}`.toUpperCase();
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <Loader2 className="h-10 w-10 animate-spin text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400 text-lg">Loading profile...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                My Profile
              </h1>
              <p className="text-gray-500 dark:text-gray-400 mt-2">
                View and manage your account information
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                onClick={() => setChangePasswordOpen(true)}
                className="flex items-center gap-2"
              >
                <Key className="h-4 w-4" />
                Change Password
              </Button>
              <Button
                onClick={() => setEditProfileOpen(true)}
                className="flex items-center gap-2 bg-gray-900 hover:bg-gray-800 dark:bg-gray-800 dark:hover:bg-gray-700"
              >
                <Edit className="h-4 w-4" />
                Edit Profile
              </Button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Personal Information Card */}
          <Card className="lg:col-span-2 shadow-lg border-gray-200 dark:border-gray-800">
            <CardHeader className="pb-6">
              <div className="flex items-center gap-4">
                <Avatar className="h-20 w-20">
                  <AvatarFallback className="bg-gradient-to-br from-teal-500 to-cyan-600 text-white text-2xl font-bold">
                    {getInitials()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <CardTitle className="text-2xl">
                    {profile?.firstName} {profile?.lastName}
                  </CardTitle>
                  <CardDescription className="mt-1">
                    {profile?.email}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-8">
              <Separator />
              
              <div className="space-y-6">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <PersonStanding className="h-5 w-5" />
                  Personal Information
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* First Name */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      First Name
                    </Label>
                    <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700">
                      <p className="text-base font-medium text-gray-900 dark:text-white">
                        {profile?.firstName || "Not provided"}
                      </p>
                    </div>
                  </div>

                  {/* Last Name */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      Last Name
                    </Label>
                    <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700">
                      <p className="text-base font-medium text-gray-900 dark:text-white">
                        {profile?.lastName || "Not provided"}
                      </p>
                    </div>
                  </div>

                  {/* Email */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-500 dark:text-gray-400 flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      Email Address
                    </Label>
                    <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700">
                      <p className="text-base font-medium text-gray-900 dark:text-white">
                        {profile?.email || "Not provided"}
                      </p>
                    </div>
                  </div>

                  {/* Phone */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-500 dark:text-gray-400 flex items-center gap-2">
                      <Phone className="h-4 w-4" />
                      Phone Number
                    </Label>
                    <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700">
                      <p className="text-base font-medium text-gray-900 dark:text-white">
                        {profile?.phone || "Not provided"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Organization Information */}
              {profile?.organization && (
                <div className="space-y-6">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <Building className="h-5 w-5" />
                    Organization Information
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                        Organization Name
                      </Label>
                      <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700">
                        <p className="text-base font-medium text-gray-900 dark:text-white">
                          {profile.organization.name}
                        </p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                        Organization Code
                      </Label>
                      <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700">
                        <p className="text-base font-mono text-gray-900 dark:text-white">
                          {profile.organization.code}
                        </p>
                      </div>
                    </div>
                    {profile.organization.address && (
                      <div className="col-span-2 space-y-2">
                        <Label className="text-sm font-medium text-gray-500 dark:text-gray-400 flex items-center gap-2">
                          <MapPin className="h-4 w-4" />
                          Organization Address
                        </Label>
                        <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700">
                          <p className="text-base text-gray-900 dark:text-white">
                            {profile.organization.address}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Driver Specific Information */}
              {profile?.role === "DRIVER" && profile?.currentRoute && (
                <>
                  <Separator />
                  <div className="space-y-6">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                      <Truck className="h-5 w-5" />
                      Current Assignment
                    </h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                          Vehicle Plate
                        </Label>
                        <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700">
                          <p className="text-base font-medium text-gray-900 dark:text-white">
                            {profile.currentRoute.vehiclePlateNumber || "Not assigned"}
                          </p>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                          Route Name
                        </Label>
                        <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700">
                          <p className="text-base font-medium text-gray-900 dark:text-white">
                            {profile.currentRoute.routeName || "Not assigned"}
                          </p>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                          Trip Status
                        </Label>
                        <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700">
                          <Badge className={cn(
                            "inline-block",
                            profile.currentRoute.tripStatus === "IN_PROGRESS" ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"
                          )}>
                            {profile.currentRoute.tripStatus || "Unknown"}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Account Information Card */}
          <Card className="shadow-lg border-gray-200 dark:border-gray-800">
            <CardHeader>
              <CardTitle className="text-2xl">Account Information</CardTitle>
              <CardDescription className="mt-2">
                Your account details and activity
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
            

                {/* Status */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    Account Status
                  </Label>
                  <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-800/30 rounded-lg">
                    <span className="text-gray-700 dark:text-gray-300">Current Status</span>
                    {getStatusBadge(profile?.isActive || false)}
                  </div>
                </div>

                {/* Role */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-500 dark:text-gray-400 flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    Role
                  </Label>
                  <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-800/30 rounded-lg">
                    <span className="text-gray-700 dark:text-gray-300">Access Level</span>
                    {getRoleBadge(profile?.role || "")}
                  </div>
                </div>

                {/* Account Created */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-500 dark:text-gray-400 flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Account Created
                  </Label>
                  <div className="p-3 bg-gray-50 dark:bg-gray-800/30 rounded-lg flex items-center gap-2">
                    <Clock className="h-4 w-4 text-gray-400" />
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {formatDate(profile?.createdAt || "")}
                    </p>
                  </div>
                </div>

                {/* Last Updated */}
                {profile?.updatedAt && (
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-500 dark:text-gray-400 flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      Last Updated
                    </Label>
                    <div className="p-3 bg-gray-50 dark:bg-gray-800/30 rounded-lg">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {formatDate(profile.updatedAt)}
                      </p>
                    </div>
                  </div>
                )}

                {/* NFC Card Information */}
                {profile?.nfc_card && (
                  <>
                    <Separator />
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <CreditCard className="h-5 w-5 text-primary" />
                        <h4 className="font-semibold">NFC Card Information</h4>
                      </div>
                      <div className="space-y-2">
                        <div className="p-3 bg-gray-50 dark:bg-gray-800/30 rounded-lg">
                          <Label className="text-xs text-muted-foreground">Card UID</Label>
                          <code className="text-sm font-mono block mt-1 break-all">
                            {profile.nfc_card.cardUid}
                          </code>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div className="p-3 bg-gray-50 dark:bg-gray-800/30 rounded-lg">
                            <Label className="text-xs text-muted-foreground">Assigned At</Label>
                            <p className="text-sm font-medium mt-1">
                              {formatDate(profile.nfc_card.assigned_at)}
                            </p>
                          </div>
                          <div className="p-3 bg-gray-50 dark:bg-gray-800/30 rounded-lg">
                            <Label className="text-xs text-muted-foreground">Expires At</Label>
                            <p className="text-sm font-medium mt-1">
                              {formatDate(profile.nfc_card.expires_at)}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Edit Profile Modal */}
        <Dialog open={editProfileOpen} onOpenChange={setEditProfileOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle className="text-2xl">Edit Profile</DialogTitle>
              <DialogDescription>
                Update your personal information
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={handleEditProfile} className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-firstName" className="text-sm font-medium">
                    First Name *
                  </Label>
                  <div className="relative">
                    <Circle className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <Input
                      id="edit-firstName"
                      value={profileForm.firstName}
                      onChange={(e) => setProfileForm({ ...profileForm, firstName: e.target.value })}
                      className="pl-10 h-12 text-base"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-lastName" className="text-sm font-medium">
                    Last Name *
                  </Label>
                  <div className="relative">
                    <PersonStandingIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <Input
                      id="edit-lastName"
                      value={profileForm.lastName}
                      onChange={(e) => setProfileForm({ ...profileForm, lastName: e.target.value })}
                      className="pl-10 h-12 text-base"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-email" className="text-sm font-medium">
                    Email Address *
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <Input
                      id="edit-email"
                      type="email"
                      value={profileForm.email}
                      onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                      className="pl-10 h-12 text-base"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-phone" className="text-sm font-medium">
                    Phone Number
                  </Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <Input
                      id="edit-phone"
                      value={profileForm.phone}
                      onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                      className="pl-10 h-12 text-base"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-6 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setEditProfileOpen(false)}
                  className="px-6 h-11"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSavingProfile}
                  className="px-6 h-11 bg-gray-900 hover:bg-gray-800 dark:bg-gray-800 dark:hover:bg-gray-700"
                >
                  {isSavingProfile ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Save Changes
                    </>
                  )}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Change Password Modal */}
        <Dialog open={changePasswordOpen} onOpenChange={setChangePasswordOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle className="text-2xl">Change Password</DialogTitle>
              <DialogDescription>
                Update your password to keep your account secure
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={handleChangePassword} className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="current-password" className="text-sm font-medium">
                    Current Password *
                  </Label>
                  <div className="relative">
                    <Key className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <Input
                      id="current-password"
                      type={showCurrentPassword ? "text" : "password"}
                      value={passwordForm.currentPassword}
                      onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                      className="pl-10 pr-12 h-12 text-base"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showCurrentPassword ? (
                        <EyeOff className="h-5 w-5" />
                      ) : (
                        <Eye className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="new-password" className="text-sm font-medium">
                    New Password *
                  </Label>
                  <div className="relative">
                    <Key className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <Input
                      id="new-password"
                      type={showNewPassword ? "text" : "password"}
                      value={passwordForm.newPassword}
                      onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                      className="pl-10 pr-12 h-12 text-base"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showNewPassword ? (
                        <EyeOff className="h-5 w-5" />
                      ) : (
                        <Eye className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirm-password" className="text-sm font-medium">
                    Confirm New Password *
                  </Label>
                  <div className="relative">
                    <Key className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <Input
                      id="confirm-password"
                      type={showConfirmPassword ? "text" : "password"}
                      value={passwordForm.confirmPassword}
                      onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                      className="pl-10 pr-12 h-12 text-base"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-5 w-5" />
                      ) : (
                        <Eye className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  <strong>Password requirements:</strong> Must be at least 6 characters long. 
                  We recommend using a mix of letters, numbers, and symbols for better security.
                </p>
              </div>

              <div className="flex justify-end space-x-3 pt-6 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setChangePasswordOpen(false)}
                  className="px-6 h-11"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isChangingPassword}
                  className="px-6 h-11 bg-gray-900 hover:bg-gray-800 dark:bg-gray-800 dark:hover:bg-gray-700"
                >
                  {isChangingPassword ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Changing...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Change Password
                    </>
                  )}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
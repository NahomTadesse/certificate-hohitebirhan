"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { User, KeyRound } from "lucide-react";
import { useSelector } from "react-redux";
import { RootState } from "@/store/store";

import DashboardLayout from "../dashboard/layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import PhoneInput from "@/components/PhoneInput";
import { getPhoneValidationError } from "@/utils/phone";
import { fetchUserProfile, updateUserProfile, changePassword } from "@/services/profileService";
import { useTranslation } from "react-i18next";

export default function ProfilePage() {
  const { t } = useTranslation();
  const { accessToken, uuid } = useSelector((state: RootState) => state.auth);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);

  const [details, setDetails] = useState({
    firstName: "",
    middleName: "",
    lastName: "",
    phoneNumber: "",
  });

  const [passwordForm, setPasswordForm] = useState({
    oldPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  useEffect(() => {
    const load = async () => {
      if (!accessToken) {
        setLoading(false);
        return;
      }
      try {
        const profile = await fetchUserProfile(accessToken);
        setDetails({
          firstName: profile.customerFirstName || "",
          middleName: "",
          lastName: profile.customerLastName || "",
          phoneNumber: "",
        });
      } catch (err: any) {
        toast.error(err.message || "Failed to load profile");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [accessToken]);

  const handleSaveDetails = async () => {
    if (!uuid) {
      toast.error("Missing user id");
      return;
    }
    const phoneError = getPhoneValidationError(details.phoneNumber);
    if (phoneError) {
      toast.error(phoneError);
      return;
    }
    setSaving(true);
    try {
      await updateUserProfile(uuid, details);
      toast.success("Profile updated successfully");
    } catch (err: any) {
      toast.error(err.message || "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (!uuid) {
      toast.error("Missing user id");
      return;
    }
    if (!passwordForm.oldPassword || !passwordForm.newPassword) {
      toast.error("Please fill in both password fields");
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error("New password and confirmation do not match");
      return;
    }
    setChangingPassword(true);
    try {
      await changePassword({
        userId: uuid,
        oldPassword: passwordForm.oldPassword,
        newPassword: passwordForm.newPassword,
      });
      toast.success("Password changed successfully");
      setPasswordForm({ oldPassword: "", newPassword: "", confirmPassword: "" });
    } catch (err: any) {
      toast.error(err.message || "Failed to change password");
    } finally {
      setChangingPassword(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6 max-w-3xl">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <User className="h-7 w-7" /> {t("My Profile")}
          </h1>
          <p className="text-muted-foreground">{t("View and update your account details")}</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{t("Personal Information")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {loading ? (
              <p className="text-sm text-muted-foreground">{t("Loading...")}</p>
            ) : (
              <>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label>{t("First Name")}</Label>
                    <Input
                      value={details.firstName}
                      onChange={(e) => setDetails({ ...details, firstName: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>{t("Middle Name")}</Label>
                    <Input
                      value={details.middleName}
                      onChange={(e) => setDetails({ ...details, middleName: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>{t("Last Name")}</Label>
                    <Input
                      value={details.lastName}
                      onChange={(e) => setDetails({ ...details, lastName: e.target.value })}
                    />
                  </div>
                </div>
                <PhoneInput
                  label={t("Phone Number")}
                  value={details.phoneNumber}
                  onChange={(v) => setDetails({ ...details, phoneNumber: v })}
                />
                <div className="flex justify-end">
                  <Button onClick={handleSaveDetails} disabled={saving}>
                    {saving ? t("Saving...") : t("Save Changes")}
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <KeyRound className="h-5 w-5" /> {t("Change Password")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>{t("Current Password")}</Label>
              <Input
                type="password"
                value={passwordForm.oldPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, oldPassword: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>{t("New Password")}</Label>
                <Input
                  type="password"
                  value={passwordForm.newPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                />
              </div>
              <div>
                <Label>{t("Confirm New Password")}</Label>
                <Input
                  type="password"
                  value={passwordForm.confirmPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                />
              </div>
            </div>
            <div className="flex justify-end">
              <Button onClick={handleChangePassword} disabled={changingPassword}>
                {changingPassword ? t("Updating...") : t("Update Password")}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}

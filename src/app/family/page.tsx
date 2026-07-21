"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Users2,
  UserPlus,
  Heart,
  ArrowUpCircle,
  AlertCircle,
  CheckCircle,
  XCircle,
  RefreshCw,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import DashboardLayout from "../dashboard/layout";
import { fetchChildrenForDropdown } from "@/services/childrenService";
import {
  addFamilyMember,
  recordMarriage,
  promoteFamilyMemberToFamilyHead,
  promoteChildToFamilyHead,
  RelationType,
} from "@/services/familyService";
import { useTranslation } from "react-i18next";

const RELATION_TYPES: RelationType[] = ["HEAD", "WIFE", "HUSBAND", "SON", "DAUGHTER", "OTHER"];

export default function FamilyManagement() {
  const { t } = useTranslation();
  const [children, setChildren] = useState<{ id: string; fullName: string }[]>([]);
  const [alert, setAlert] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadChildren = useCallback(async () => {
    try {
      const data = await fetchChildrenForDropdown();
      setChildren(data || []);
    } catch {
      setChildren([]);
    }
  }, []);

  useEffect(() => {
    loadChildren();
  }, [loadChildren]);

  const showResult = (type: "success" | "error", message: string) => {
    setAlert({ type, message });
    setTimeout(() => setAlert(null), 4000);
  };

  // --- Add Member state ---
  const [familyHeadId, setFamilyHeadId] = useState("");
  const [memberForm, setMemberForm] = useState({
    firstName: "",
    middleName: "",
    lastName: "",
    dateOfBirth: "",
    gender: "",
    relationType: "SON" as RelationType,
    existingChildId: "",
  });

  const handleAddMember = async () => {
    if (!familyHeadId) return showResult("error", "Select a family head first.");
    setIsSubmitting(true);
    try {
      await addFamilyMember(familyHeadId, memberForm);
      showResult("success", "Family member added successfully!");
      setMemberForm({
        firstName: "",
        middleName: "",
        lastName: "",
        dateOfBirth: "",
        gender: "",
        relationType: "SON",
        existingChildId: "",
      });
    } catch (err: any) {
      showResult("error", err.message || "Failed to add family member.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- Marriage state ---
  const [marriageHeadId, setMarriageHeadId] = useState("");
  const [marriageForm, setMarriageForm] = useState({
    brideFamilyMemberId: "",
    groomNationality: "",
    brideName: "",
    brideNationality: "",
    performingPriestName: "",
    church: "",
    country: "",
    marriageDate: "",
    witnessNames: "",
  });

  const handleRecordMarriage = async () => {
    if (!marriageHeadId) return showResult("error", "Select the family head (groom) first.");
    setIsSubmitting(true);
    try {
      await recordMarriage(marriageHeadId, {
        ...marriageForm,
        witnessNames: marriageForm.witnessNames
          ? marriageForm.witnessNames.split(",").map((w) => w.trim())
          : [],
      });
      showResult("success", "Marriage recorded successfully!");
    } catch (err: any) {
      showResult("error", err.message || "Failed to record marriage.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- Promotion state ---
  const [promoteType, setPromoteType] = useState<"member" | "child">("child");
  const [promoteId, setPromoteId] = useState("");

  const handlePromote = async () => {
    if (!promoteId) return showResult("error", "Provide an id to promote.");
    setIsSubmitting(true);
    try {
      if (promoteType === "child") {
        await promoteChildToFamilyHead(promoteId);
      } else {
        await promoteFamilyMemberToFamilyHead(promoteId);
      }
      showResult("success", "Promoted to family head successfully!");
      setPromoteId("");
    } catch (err: any) {
      showResult("error", err.message || "Promotion failed.");
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
              <Users2 className="h-7 w-7" /> {t("Family Management")}
            </h1>
            <p className="text-muted-foreground">
              {t("Manage family units: add members, record marriages, and promote members to family heads")}
            </p>
          </div>
          <Button variant="outline" size="icon" onClick={loadChildren}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>

        {alert && (
          <Alert variant={alert.type === "error" ? "destructive" : "default"}>
            {alert.type === "success" ? <CheckCircle className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
            <AlertDescription>{alert.message}</AlertDescription>
          </Alert>
        )}

        <Tabs defaultValue="member" className="w-full">
          <TabsList>
            <TabsTrigger value="member">
              <UserPlus className="h-4 w-4 mr-1" /> {t("Add Member")}
            </TabsTrigger>
            <TabsTrigger value="marriage">
              <Heart className="h-4 w-4 mr-1" /> {t("Record Marriage")}
            </TabsTrigger>
            <TabsTrigger value="promote">
              <ArrowUpCircle className="h-4 w-4 mr-1" /> {t("Promote to Family Head")}
            </TabsTrigger>
          </TabsList>

          {/* Add Member */}
          <TabsContent value="member" className="space-y-4 max-w-2xl">
            <div>
              <Label>{t("Family Head")} *</Label>
              <Select value={familyHeadId} onValueChange={setFamilyHeadId}>
                <SelectTrigger>
                  <SelectValue placeholder={t("Select family head")} />
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

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>{t("First Name")}</Label>
                <Input
                  value={memberForm.firstName}
                  onChange={(e) => setMemberForm({ ...memberForm, firstName: e.target.value })}
                />
              </div>
              <div>
                <Label>{t("Middle Name")}</Label>
                <Input
                  value={memberForm.middleName}
                  onChange={(e) => setMemberForm({ ...memberForm, middleName: e.target.value })}
                />
              </div>
              <div>
                <Label>{t("Last Name")}</Label>
                <Input
                  value={memberForm.lastName}
                  onChange={(e) => setMemberForm({ ...memberForm, lastName: e.target.value })}
                />
              </div>
              <div>
                <Label>{t("Date of Birth")}</Label>
                <Input
                  type="date"
                  value={memberForm.dateOfBirth}
                  onChange={(e) => setMemberForm({ ...memberForm, dateOfBirth: e.target.value })}
                />
              </div>
              <div>
                <Label>{t("Gender")}</Label>
                <Input
                  value={memberForm.gender}
                  onChange={(e) => setMemberForm({ ...memberForm, gender: e.target.value })}
                  placeholder="MALE / FEMALE"
                />
              </div>
              <div>
                <Label>{t("Relation")} *</Label>
                <Select
                  value={memberForm.relationType}
                  onValueChange={(v) => setMemberForm({ ...memberForm, relationType: v as RelationType })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {RELATION_TYPES.map((r) => (
                      <SelectItem key={r} value={r}>
                        {r}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>{t("Existing Child Id (optional)")}</Label>
              <Input
                value={memberForm.existingChildId}
                onChange={(e) => setMemberForm({ ...memberForm, existingChildId: e.target.value })}
                placeholder={t("Link to an already-registered child instead of creating a new one")}
              />
            </div>
            <Button onClick={handleAddMember} disabled={isSubmitting}>
              {isSubmitting ? t("Saving...") : t("Add Family Member")}
            </Button>
          </TabsContent>

          {/* Marriage */}
          <TabsContent value="marriage" className="space-y-4 max-w-2xl">
            <div>
              <Label>{t("Family Head (Groom)")} *</Label>
              <Select value={marriageHeadId} onValueChange={setMarriageHeadId}>
                <SelectTrigger>
                  <SelectValue placeholder={t("Select family head")} />
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
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>{t("Bride Name")}</Label>
                <Input
                  value={marriageForm.brideName}
                  onChange={(e) => setMarriageForm({ ...marriageForm, brideName: e.target.value })}
                />
              </div>
              <div>
                <Label>{t("Existing Bride Family Member Id")}</Label>
                <Input
                  value={marriageForm.brideFamilyMemberId}
                  onChange={(e) =>
                    setMarriageForm({ ...marriageForm, brideFamilyMemberId: e.target.value })
                  }
                />
              </div>
              <div>
                <Label>{t("Groom Nationality")}</Label>
                <Input
                  value={marriageForm.groomNationality}
                  onChange={(e) => setMarriageForm({ ...marriageForm, groomNationality: e.target.value })}
                />
              </div>
              <div>
                <Label>{t("Bride Nationality")}</Label>
                <Input
                  value={marriageForm.brideNationality}
                  onChange={(e) => setMarriageForm({ ...marriageForm, brideNationality: e.target.value })}
                />
              </div>
              <div>
                <Label>{t("Performing Priest")}</Label>
                <Input
                  value={marriageForm.performingPriestName}
                  onChange={(e) =>
                    setMarriageForm({ ...marriageForm, performingPriestName: e.target.value })
                  }
                />
              </div>
              <div>
                <Label>{t("Church")}</Label>
                <Input
                  value={marriageForm.church}
                  onChange={(e) => setMarriageForm({ ...marriageForm, church: e.target.value })}
                />
              </div>
              <div>
                <Label>{t("Country")}</Label>
                <Input
                  value={marriageForm.country}
                  onChange={(e) => setMarriageForm({ ...marriageForm, country: e.target.value })}
                />
              </div>
              <div>
                <Label>{t("Marriage Date")}</Label>
                <Input
                  type="date"
                  value={marriageForm.marriageDate}
                  onChange={(e) => setMarriageForm({ ...marriageForm, marriageDate: e.target.value })}
                />
              </div>
            </div>
            <div>
              <Label>{t("Witness Names (comma separated)")}</Label>
              <Input
                value={marriageForm.witnessNames}
                onChange={(e) => setMarriageForm({ ...marriageForm, witnessNames: e.target.value })}
                placeholder="Witness One, Witness Two"
              />
            </div>
            <Button onClick={handleRecordMarriage} disabled={isSubmitting}>
              {isSubmitting ? t("Saving...") : t("Record Marriage")}
            </Button>
          </TabsContent>

          {/* Promote */}
          <TabsContent value="promote" className="space-y-4 max-w-2xl">
            <div>
              <Label>{t("Promote")} *</Label>
              <Select value={promoteType} onValueChange={(v) => setPromoteType(v as "member" | "child")}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="child">{t("A registered Child")}</SelectItem>
                  <SelectItem value="member">{t("An existing Family Member")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>{promoteType === "child" ? t("Child Id") : t("Family Member Id")} *</Label>
              {promoteType === "child" ? (
                <Select value={promoteId} onValueChange={setPromoteId}>
                  <SelectTrigger>
                    <SelectValue placeholder={t("Select child")} />
                  </SelectTrigger>
                  <SelectContent>
                    {children.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.fullName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Input value={promoteId} onChange={(e) => setPromoteId(e.target.value)} />
              )}
            </div>
            <Button onClick={handlePromote} disabled={isSubmitting}>
              {isSubmitting ? t("Promoting...") : t("Promote to Family Head")}
            </Button>
          </TabsContent>
        </Tabs>

        {!alert && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {t(
                "Tip: New family members can be linked to an existing registered child using the optional id field, instead of creating a duplicate record."
              )}
            </AlertDescription>
          </Alert>
        )}
      </div>
    </DashboardLayout>
  );
}

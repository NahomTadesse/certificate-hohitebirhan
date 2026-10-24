"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Link2, Unlink, RefreshCw } from "lucide-react";
import { useTranslation } from "react-i18next";

import DashboardLayout from "../dashboard/layout";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import SearchableSelect from "@/components/SearchableSelect";
import {
  GuardianRelation,
  linkGuardianToChild,
  unlinkGuardianFromChild,
  linkFatherToUser,
  fetchGuardianChildren,
  fetchFatherUserChildren,
  fetchChildGuardians,
} from "@/services/portalService";
import { fetchAllUsersPaginated, AdminUser } from "@/services/userManagementService";
import { fetchChildrenForDropdown, ChildDropdownOption } from "@/services/childrenService";
import { fetchFathersForDropdown } from "@/services/fatherService";

const userLabel = (u: AdminUser) =>
  `${[u.firstname, u.lastname].filter(Boolean).join(" ") || u.userName || u.email || u.uuid}${u.role ? ` (${u.role})` : ""}`;

export default function PortalPage() {
  const { t } = useTranslation();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [children, setChildren] = useState<ChildDropdownOption[]>([]);
  const [fathers, setFathers] = useState<{ id: string; fullName: string; churchName?: string }[]>([]);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    fetchAllUsersPaginated(0, 1000).then((p) => setUsers(p.content || [])).catch(() => {});
    fetchChildrenForDropdown().then(setChildren).catch(() => {});
    fetchFathersForDropdown().then(setFathers).catch(() => {});
  }, []);

  const userOptions = users.filter((u) => u.uuid).map((u) => ({ value: u.uuid as string, label: userLabel(u) }));
  const childOptions = children.map((c) => ({ value: c.id, label: c.fullName }));

  // ---- guardian <-> child ----
  const [gUser, setGUser] = useState("");
  const [gChild, setGChild] = useState("");
  const [relation, setRelation] = useState<GuardianRelation>("PARENT");
  const [guardianKids, setGuardianKids] = useState<any[]>([]);

  const loadGuardianKids = useCallback(async () => {
    if (!gUser) return setGuardianKids([]);
    try {
      setGuardianKids(await fetchGuardianChildren(gUser));
    } catch {
      setGuardianKids([]);
    }
  }, [gUser]);
  useEffect(() => {
    loadGuardianKids();
  }, [loadGuardianKids]);

  const act = async (fn: () => Promise<any>, ok: string, after?: () => void) => {
    setBusy(true);
    try {
      await fn();
      toast.success(ok);
      after?.();
    } catch (err: any) {
      toast.error(err.message || t("Operation failed"));
    } finally {
      setBusy(false);
    }
  };

  // ---- father <-> user ----
  const [fFather, setFFather] = useState("");
  const [fUser, setFUser] = useState("");
  const [fatherUserKids, setFatherUserKids] = useState<any[]>([]);
  const [fkUser, setFkUser] = useState("");

  // ---- child -> guardians ----
  const [cChild, setCChild] = useState("");
  const [guardians, setGuardians] = useState<any[]>([]);
  const loadGuardians = useCallback(async () => {
    if (!cChild) return setGuardians([]);
    try {
      setGuardians(await fetchChildGuardians(cChild));
    } catch {
      setGuardians([]);
    }
  }, [cChild]);
  useEffect(() => {
    loadGuardians();
  }, [loadGuardians]);

  const nm = (c: any) => c?.fullName || c?.childName || [c?.firstName, c?.middleName, c?.lastName].filter(Boolean).join(" ") || c?.id;

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Link2 className="h-8 w-8 text-primary" /> {t("Portal Links")}
          </h1>
          <p className="text-muted-foreground">{t("Connect user accounts to children (guardians) and to fathers for the member portal")}</p>
        </div>

        <Tabs defaultValue="guardians">
          <TabsList>
            <TabsTrigger value="guardians">{t("Guardians")}</TabsTrigger>
            <TabsTrigger value="fathers">{t("Father accounts")}</TabsTrigger>
          </TabsList>

          <TabsContent value="guardians" className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-4">
            <Card>
              <CardHeader>
                <CardTitle>{t("Link a guardian to a child")}</CardTitle>
                <CardDescription>{t("The guardian will see this child's timeline in the portal")}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <Label>{t("User account")}</Label>
                  <SearchableSelect value={gUser} onChange={setGUser} options={userOptions} placeholder={t("Select a user")} searchPlaceholder={t("Search users...")} />
                </div>
                <div>
                  <Label>{t("Child")}</Label>
                  <SearchableSelect value={gChild} onChange={setGChild} options={childOptions} placeholder={t("Select a child")} searchPlaceholder={t("Search children...")} />
                </div>
                <div>
                  <Label>{t("Relation")}</Label>
                  <Select value={relation} onValueChange={(v) => setRelation(v as GuardianRelation)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PARENT">{t("Parent")}</SelectItem>
                      <SelectItem value="GUARDIAN">{t("Guardian")}</SelectItem>
                      <SelectItem value="OTHER">{t("Other")}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  disabled={busy || !gUser || !gChild}
                  className="w-full"
                  onClick={() => act(() => linkGuardianToChild(gUser, gChild, relation), t("Guardian linked"), () => { loadGuardianKids(); loadGuardians(); })}
                >
                  <Link2 className="h-4 w-4 mr-2" />{t("Link")}
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>{t("Children of the selected guardian")}</CardTitle>
                  <Button variant="ghost" size="icon" onClick={loadGuardianKids}><RefreshCw className="h-4 w-4" /></Button>
                </div>
                <CardDescription>{t("Choose a user on the left to see their linked children")}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {guardianKids.length === 0 && <p className="text-sm text-muted-foreground">{t("No linked children")}</p>}
                {guardianKids.map((c, i) => (
                  <div key={c.id || c.childId || i} className="flex items-center justify-between border rounded-md p-2">
                    <div>
                      <div className="font-medium text-sm">{nm(c)}</div>
                      {c.relation && <Badge variant="outline">{c.relation}</Badge>}
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-red-600"
                      disabled={busy}
                      onClick={() => act(() => unlinkGuardianFromChild(gUser, c.childId || c.id), t("Guardian unlinked"), () => { loadGuardianKids(); loadGuardians(); })}
                    >
                      <Unlink className="h-4 w-4 mr-1" />{t("Unlink")}
                    </Button>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>{t("Guardians of a child")}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <SearchableSelect value={cChild} onChange={setCChild} options={childOptions} placeholder={t("Select a child")} searchPlaceholder={t("Search children...")} />
                {guardians.length === 0 && cChild && <p className="text-sm text-muted-foreground">{t("No guardians linked")}</p>}
                {guardians.map((g, i) => (
                  <div key={g.userId || g.id || i} className="flex items-center justify-between border rounded-md p-2">
                    <div className="text-sm">
                      <div className="font-medium">{g.fullName || g.userName || g.name || g.userId}</div>
                      <div className="text-xs text-muted-foreground">{g.phoneNumber || g.email || ""}</div>
                    </div>
                    {g.relation && <Badge variant="outline">{g.relation}</Badge>}
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="fathers" className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-4">
            <Card>
              <CardHeader>
                <CardTitle>{t("Link a father to a user account")}</CardTitle>
                <CardDescription>{t("Lets the father sign in and see his appointments and children")}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <Label>{t("Father")}</Label>
                  <SearchableSelect value={fFather} onChange={setFFather}
                    options={fathers.map((f) => ({ value: f.id, label: f.fullName + (f.churchName ? ` — ${f.churchName}` : "") }))}
                    placeholder={t("Select a priest")} searchPlaceholder={t("Search priests...")} />
                </div>
                <div>
                  <Label>{t("User account")}</Label>
                  <SearchableSelect value={fUser} onChange={setFUser} options={userOptions} placeholder={t("Select a user")} searchPlaceholder={t("Search users...")} />
                </div>
                <Button disabled={busy || !fFather || !fUser} className="w-full" onClick={() => act(() => linkFatherToUser(fFather, fUser), t("Father linked"))}>
                  <Link2 className="h-4 w-4 mr-2" />{t("Link")}
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{t("Children visible to a father account")}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex gap-2">
                  <div className="flex-1">
                    <SearchableSelect value={fkUser} onChange={setFkUser} options={userOptions} placeholder={t("Select a user")} searchPlaceholder={t("Search users...")} />
                  </div>
                  <Button
                    variant="outline"
                    disabled={!fkUser}
                    onClick={async () => {
                      try {
                        setFatherUserKids((await fetchFatherUserChildren(fkUser)).content || []);
                      } catch (err: any) {
                        toast.error(err.message || t("Operation failed"));
                      }
                    }}
                  >
                    {t("Load")}
                  </Button>
                </div>
                <div className="max-h-64 overflow-y-auto space-y-1">
                  {fatherUserKids.length === 0 && <p className="text-sm text-muted-foreground">{t("Nothing loaded")}</p>}
                  {fatherUserKids.map((c, i) => <div key={c.id || i} className="text-sm border-b py-1">{nm(c)}</div>)}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}

"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { MessageSquare, Send, Save, Users } from "lucide-react";
import { useTranslation } from "react-i18next";

import DashboardLayout from "../dashboard/layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import SearchableSelect from "@/components/SearchableSelect";
import PhoneInput from "@/components/PhoneInput";
import {
  SmsTemplate,
  SmsRecipientType,
  fetchSmsTemplates,
  saveSmsTemplate,
  sendRawSms,
  sendSmsToFather,
  sendSmsToChild,
  sendBulkWelcomeSms,
  sendBulkSmsToList,
} from "@/services/smsService";
import { fetchChurchesForDropdown } from "@/services/churchService";
import { fetchChildrenForDropdown, ChildDropdownOption } from "@/services/childrenService";
import { fetchFathersForDropdown } from "@/services/fatherService";

// Extract {{placeholder}} / {placeholder} names from a template body
const placeholdersOf = (content?: string): string[] => {
  if (!content) return [];
  const found = new Set<string>();
  const re = /\{\{\s*([\w.]+)\s*\}\}|\{([\w.]+)\}/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(content))) found.add(m[1] || m[2]);
  return Array.from(found);
};

export default function SmsPage() {
  const { t } = useTranslation();
  const [templates, setTemplates] = useState<SmsTemplate[]>([]);
  const [churches, setChurches] = useState<{ id: string; name: string }[]>([]);
  const [children, setChildren] = useState<ChildDropdownOption[]>([]);
  const [fathers, setFathers] = useState<{ id: string; fullName: string; churchName?: string }[]>([]);
  const [busy, setBusy] = useState(false);

  const loadTemplates = useCallback(async () => {
    try {
      setTemplates(await fetchSmsTemplates());
    } catch (err: any) {
      toast.error(err.message || t("Failed to load templates"));
    }
  }, [t]);

  useEffect(() => {
    loadTemplates();
    fetchChurchesForDropdown().then(setChurches).catch(() => {});
    fetchChildrenForDropdown().then(setChildren).catch(() => {});
    fetchFathersForDropdown().then(setFathers).catch(() => {});
  }, [loadTemplates]);

  const guard = async (fn: () => Promise<any>, ok: string) => {
    setBusy(true);
    try {
      await fn();
      toast.success(ok);
      return true;
    } catch (err: any) {
      toast.error(err.message || t("Operation failed"));
      return false;
    } finally {
      setBusy(false);
    }
  };

  // ---- templates ----
  const [tpl, setTpl] = useState<SmsTemplate>({ code: "", content: "", description: "" });
  const saveTpl = async () => {
    if (!tpl.code.trim() || !tpl.content.trim()) return toast.error(t("Code and content are required"));
    if (await guard(() => saveSmsTemplate({ ...tpl, code: tpl.code.trim() }), t("Template saved"))) {
      setTpl({ code: "", content: "", description: "" });
      loadTemplates();
    }
  };

  // ---- raw ----
  const [raw, setRaw] = useState({ phone: "", message: "" });

  // ---- templated single send ----
  const [target, setTarget] = useState<"CHILD" | "FATHER">("CHILD");
  const [targetId, setTargetId] = useState("");
  const [templateCode, setTemplateCode] = useState("");
  const [values, setValues] = useState<Record<string, string>>({});
  const selectedTpl = templates.find((x) => x.code === templateCode);
  const phs = placeholdersOf(selectedTpl?.content);

  const sendTemplated = async () => {
    if (!targetId || !templateCode) return toast.error(t("Select a recipient and a template"));
    const fn = target === "CHILD" ? () => sendSmsToChild(targetId, templateCode, values) : () => sendSmsToFather(targetId, templateCode, values);
    await guard(fn, t("SMS sent"));
  };

  // ---- bulk welcome ----
  const [welcomeChurch, setWelcomeChurch] = useState("");

  // ---- bulk list ----
  const [bulkType, setBulkType] = useState<SmsRecipientType>("CHILD");
  const [bulkIds, setBulkIds] = useState<string[]>([]);
  const [bulkMode, setBulkMode] = useState<"template" | "raw">("raw");
  const [bulkTemplate, setBulkTemplate] = useState("");
  const [bulkRaw, setBulkRaw] = useState("");
  const bulkOptions =
    bulkType === "CLERGY"
      ? fathers.map((f) => ({ id: f.id, label: f.fullName }))
      : children.map((c) => ({ id: c.id, label: c.fullName }));
  const toggleBulk = (id: string) => setBulkIds((l) => (l.includes(id) ? l.filter((x) => x !== id) : [...l, id]));

  const sendBulk = async () => {
    if (bulkIds.length === 0) return toast.error(t("Select at least one recipient"));
    if (bulkMode === "raw" && !bulkRaw.trim()) return toast.error(t("Write a message"));
    if (bulkMode === "template" && !bulkTemplate) return toast.error(t("Select a template"));
    await guard(
      () =>
        sendBulkSmsToList({
          recipients: bulkIds.map((id) => ({ recipientId: id, recipientType: bulkType })),
          templateCode: bulkMode === "template" ? bulkTemplate : undefined,
          rawMessage: bulkMode === "raw" ? bulkRaw : undefined,
        }),
      t("Bulk SMS queued")
    );
  };

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <MessageSquare className="h-8 w-8 text-primary" /> {t("SMS")}
          </h1>
          <p className="text-muted-foreground">{t("Send messages to members and clergy, and manage message templates")}</p>
        </div>

        <Tabs defaultValue="send">
          <TabsList>
            <TabsTrigger value="send">{t("Send")}</TabsTrigger>
            <TabsTrigger value="bulk">{t("Bulk")}</TabsTrigger>
            <TabsTrigger value="templates">{t("Templates")}</TabsTrigger>
          </TabsList>

          <TabsContent value="send" className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-4">
            <Card>
              <CardHeader>
                <CardTitle>{t("Send from a template")}</CardTitle>
                <CardDescription>{t("Pick a recipient and a saved template")}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <Label>{t("Recipient type")}</Label>
                    <Select value={target} onValueChange={(v) => { setTarget(v as any); setTargetId(""); }}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="CHILD">{t("Child")}</SelectItem>
                        <SelectItem value="FATHER">{t("Father")}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="col-span-2">
                    <Label>{t("Recipient")}</Label>
                    <SearchableSelect
                      value={targetId}
                      onChange={setTargetId}
                      options={(target === "CHILD" ? children.map((c) => ({ value: c.id, label: c.fullName })) : fathers.map((f) => ({ value: f.id, label: f.fullName })))}
                      placeholder={t("Select")}
                      searchPlaceholder={t("Search...")}
                    />
                  </div>
                </div>
                <div>
                  <Label>{t("Template")}</Label>
                  <Select value={templateCode} onValueChange={(v) => { setTemplateCode(v); setValues({}); }}>
                    <SelectTrigger><SelectValue placeholder={t("Select a template")} /></SelectTrigger>
                    <SelectContent>
                      {templates.map((x) => <SelectItem key={x.code} value={x.code}>{x.code}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  {selectedTpl && <p className="text-xs text-muted-foreground mt-2 whitespace-pre-wrap">{selectedTpl.content}</p>}
                </div>
                {phs.map((p) => (
                  <div key={p}>
                    <Label>{p}</Label>
                    <Input value={values[p] || ""} onChange={(e) => setValues({ ...values, [p]: e.target.value })} />
                  </div>
                ))}
                <Button onClick={sendTemplated} disabled={busy} className="w-full"><Send className="h-4 w-4 mr-2" />{t("Send SMS")}</Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{t("Send a custom message")}</CardTitle>
                <CardDescription>{t("Send any text to a phone number")}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <PhoneInput className="space-y-1.5 [&>label]:mb-0" label={t("Phone Number")} value={raw.phone} onChange={(v) => setRaw({ ...raw, phone: v })} />
                <div>
                  <Label>{t("Message")}</Label>
                  <Textarea rows={4} value={raw.message} onChange={(e) => setRaw({ ...raw, message: e.target.value })} />
                </div>
                <Button
                  disabled={busy}
                  className="w-full"
                  onClick={async () => {
                    if (!raw.phone || !raw.message.trim()) return toast.error(t("Phone and message are required"));
                    if (await guard(() => sendRawSms(raw.phone, raw.message), t("SMS sent"))) setRaw({ phone: "", message: "" });
                  }}
                >
                  <Send className="h-4 w-4 mr-2" />{t("Send SMS")}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="bulk" className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Users className="h-5 w-5" />{t("Welcome message to a church")}</CardTitle>
                <CardDescription>{t("Sends the welcome template to every member of the selected church")}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Select value={welcomeChurch} onValueChange={setWelcomeChurch}>
                  <SelectTrigger><SelectValue placeholder={t("Select a church")} /></SelectTrigger>
                  <SelectContent>{churches.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                </Select>
                <Button
                  disabled={busy || !welcomeChurch}
                  className="w-full"
                  onClick={() => guard(() => sendBulkWelcomeSms(welcomeChurch), t("Welcome SMS queued"))}
                >
                  {t("Send welcome SMS")}
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{t("Message a list of people")}</CardTitle>
                <CardDescription>{t("Choose recipients and a message or template")}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>{t("Recipient type")}</Label>
                    <Select value={bulkType} onValueChange={(v) => { setBulkType(v as SmsRecipientType); setBulkIds([]); }}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="CHILD">{t("Child")}</SelectItem>
                        <SelectItem value="FAMILY_HEAD">{t("Family Head")}</SelectItem>
                        <SelectItem value="CLERGY">{t("Clergy")}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>{t("Message source")}</Label>
                    <Select value={bulkMode} onValueChange={(v) => setBulkMode(v as any)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="raw">{t("Custom message")}</SelectItem>
                        <SelectItem value="template">{t("Template")}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                {bulkMode === "raw" ? (
                  <Textarea rows={3} placeholder={t("Message")} value={bulkRaw} onChange={(e) => setBulkRaw(e.target.value)} />
                ) : (
                  <Select value={bulkTemplate} onValueChange={setBulkTemplate}>
                    <SelectTrigger><SelectValue placeholder={t("Select a template")} /></SelectTrigger>
                    <SelectContent>{templates.map((x) => <SelectItem key={x.code} value={x.code}>{x.code}</SelectItem>)}</SelectContent>
                  </Select>
                )}
                <div className="flex items-center justify-between">
                  <Label>{t("Recipients")} ({bulkIds.length})</Label>
                  <div className="flex gap-2">
                    <Button type="button" variant="ghost" size="sm" onClick={() => setBulkIds(bulkOptions.map((o) => o.id))}>{t("Select all")}</Button>
                    <Button type="button" variant="ghost" size="sm" onClick={() => setBulkIds([])}>{t("Clear")}</Button>
                  </div>
                </div>
                <div className="max-h-56 overflow-y-auto border rounded-md p-2 space-y-1">
                  {bulkOptions.map((o) => (
                    <label key={o.id} className="flex items-center gap-2 text-sm">
                      <Checkbox checked={bulkIds.includes(o.id)} onCheckedChange={() => toggleBulk(o.id)} />
                      {o.label}
                    </label>
                  ))}
                </div>
                <Button onClick={sendBulk} disabled={busy} className="w-full"><Send className="h-4 w-4 mr-2" />{t("Send to selected")}</Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="templates" className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-4">
            <Card>
              <CardHeader>
                <CardTitle>{t("Save a template")}</CardTitle>
                <CardDescription>{t("Use {name}-style placeholders; saving an existing code updates it")}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div><Label>{t("Code")} *</Label><Input value={tpl.code} onChange={(e) => setTpl({ ...tpl, code: e.target.value })} /></div>
                <div><Label>{t("Description")}</Label><Input value={tpl.description || ""} onChange={(e) => setTpl({ ...tpl, description: e.target.value })} /></div>
                <div><Label>{t("Content")} *</Label><Textarea rows={5} value={tpl.content} onChange={(e) => setTpl({ ...tpl, content: e.target.value })} /></div>
                <Button onClick={saveTpl} disabled={busy}><Save className="h-4 w-4 mr-2" />{t("Save template")}</Button>
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle>{t("Saved templates")}</CardTitle></CardHeader>
              <CardContent className="space-y-2 max-h-[28rem] overflow-y-auto">
                {templates.length === 0 && <p className="text-sm text-muted-foreground">{t("No templates yet")}</p>}
                {templates.map((x) => (
                  <button
                    key={x.code}
                    type="button"
                    className="w-full text-left border rounded-md p-3 hover:bg-muted/50"
                    onClick={() => setTpl({ id: x.id, code: x.code, content: x.content, description: x.description || "" })}
                  >
                    <div className="font-mono text-sm font-semibold">{x.code}</div>
                    {x.description && <div className="text-xs text-muted-foreground">{x.description}</div>}
                    <div className="text-sm mt-1 whitespace-pre-wrap">{x.content}</div>
                  </button>
                ))}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}

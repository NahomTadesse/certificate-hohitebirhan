"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { toast } from "sonner";
import {
  Building,
  Plus,
  Edit,
  Eye,
  MoreVertical,
  Trash2,
  Search,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  XCircle,
  Mail,
  Phone,
  MapPin,
  Hash,
  Church as ch,
  Globe,
  Home,
  Map,
  Navigation,
  House,
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";

import DashboardLayout from "../dashboard/layout";
import {
  fetchChurches,
  createChurch,
  updateChurch,
  deactivateChurch,
  fetchChurchById,
  Church,
  Address,
} from "@/services/churchService";
import { useTranslation } from "react-i18next";
import { fetchDioceses, Diocese } from "@/services/dioceseService";
import SearchableSelect from "@/components/SearchableSelect";

export default function ChurchManagement() {
  const [churches, setChurches] = useState<Church[]>([]);
  const [dioceses, setDioceses] = useState<Diocese[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [viewLoading, setViewLoading] = useState(false);
  const [selectedChurch, setSelectedChurch] = useState<Church | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState("basic");
  const { t } = useTranslation();

  const defaultAddress: Address = {
    street: "",
    city: "",
    state: "",
    zipCode: "",
    country: "Ethiopia",
    region: "",
    zone: "",
    woreda: "",
    kebele: "",
    additionalInfo: "",
    district: "",
    houseNumber: "",
    subcity: "",
    addressType: "CHURCH_ADDRESS",
  };

  const [formState, setFormState] = useState({
    name: "",
    diocese: "",
    address: defaultAddress,
  });

  const loadChurches = useCallback(async (search?: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetchChurches(0, 1000, search);
      setChurches(response.data || []);
    } catch (err: any) {
      setError("Failed to load churches. " + err.message);
      setChurches([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadDioceses = useCallback(async () => {
    try {
      const list = await fetchDioceses();
      setDioceses(list || []);
    } catch (err) {
      setDioceses([]);
    }
  }, []);

  useEffect(() => {
    loadChurches();
    loadDioceses();
  }, [loadChurches, loadDioceses]);

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
      loadChurches(searchQuery);
    }, 400);
    return () => clearTimeout(handle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery]);

  const filteredChurches = useMemo(() => {
    const query = searchQuery.toLowerCase();
    return churches.filter((church) =>
      (church.name || "").toLowerCase().includes(query) ||
      (church.diocese || "").toLowerCase().includes(query) ||
      (church.address?.city || "").toLowerCase().includes(query)
    );
  }, [churches, searchQuery]);

  // Open a dialog only after the dropdown menu has fully closed. Opening both at once can leave
  // the page with pointer-events disabled (the "stuck page").
  const afterMenuClose = (fn: () => void) => {
    setTimeout(fn, 80);
  };

  // Safety net: if every dialog is closed, make sure the body is clickable again.
  useEffect(() => {
    if (isDialogOpen || isViewDialogOpen || isDeleteDialogOpen) return;
    const t = setTimeout(() => {
      if (document.body.style.pointerEvents === "none") document.body.style.pointerEvents = "";
      document.body.removeAttribute("data-scroll-locked");
    }, 300);
    return () => clearTimeout(t);
  }, [isDialogOpen, isViewDialogOpen, isDeleteDialogOpen]);

  const isChurchActive = (c: Church) => ((c as any).isActive ?? (c as any).active) !== false;

  // Merge API address (may contain nulls) over the defaults so inputs stay controlled
  const normalizeAddress = (a?: Partial<Address> | null): Address => {
    const merged: any = { ...defaultAddress };
    Object.entries(a || {}).forEach(([k, v]) => {
      if (v !== null && v !== undefined) merged[k] = v;
    });
    return merged as Address;
  };

  const handleView = async (church: Church) => {
    setSelectedChurch(church);
    setIsViewDialogOpen(true);
    setViewLoading(true);
    try {
      const res = await fetchChurchById(church.id);
      const fresh: any = (res as any)?.data ?? res;
      if (fresh && fresh.id) setSelectedChurch({ ...church, ...fresh });
    } catch {
      // keep the row data if the detail call fails
    } finally {
      setViewLoading(false);
    }
  };

  const columns: ColumnDef<Church>[] = [
    {
      accessorKey: "name",
      header: t("Church Name"),
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <House className="h-5 w-5 text-primary" />
          </div>
          <div>
            <div className="font-semibold">{row.original.name}</div>
            <div className="text-sm text-muted-foreground">{row.original.address?.city || "-"}</div>
          </div>
        </div>
      ),
    },
    {
      accessorKey: "diocese",
      header: t("Diocese"),
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Globe className="h-3 w-3 text-muted-foreground" />
          <span className="text-sm">{row.original.diocese}</span>
        </div>
      ),
    },
    {
      accessorKey: "address.city",
      header: t("City"),
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <MapPin className="h-3 w-3 text-muted-foreground" />
          <span className="text-sm">{row.original.address?.city || "-"}</span>
        </div>
      ),
    },
    {
      accessorKey: "address.subcity",
      header: t("Subcity"),
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Navigation className="h-3 w-3 text-muted-foreground" />
          <span className="text-sm">{row.original.address?.subcity || "-"}</span>
        </div>
      ),
    },
    {
      accessorKey: "address.woreda",
      header: t("Woreda"),
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Hash className="h-3 w-3 text-muted-foreground" />
          <span className="text-sm">{row.original.address?.woreda || "-"}</span>
        </div>
      ),
    },
    {
      accessorKey: "isActive",
      header: t("Status"),
      cell: ({ row }) => {
        const active = isChurchActive(row.original);
        return (
          <Badge className={active ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>
            {active ? t("ACTIVE") : t("INACTIVE")}
          </Badge>
        );
      },
    },
    {
      id: "actions",
      cell: ({ row }) => (
        <DropdownMenu modal={false}>
          <DropdownMenuTrigger asChild>
            <Button size="sm" variant="ghost">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onSelect={() => afterMenuClose(() => handleView(row.original))}>
              <Eye className="h-4 w-4 mr-2" /> {t("View Details")}
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => afterMenuClose(() => handleEdit(row.original))}>
              <Edit className="h-4 w-4 mr-2" /> {t("Edit")}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-red-600 focus:text-red-600"
              onSelect={() =>
                afterMenuClose(() => {
                  setSelectedChurch(row.original);
                  setIsDeleteDialogOpen(true);
                })
              }
            >
              <Trash2 className="h-4 w-4 mr-2" /> {t("Delete")}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  const handleAdd = () => {
    setSelectedChurch(null);
    setFormState({
      name: "",
      diocese: "",
      address: { ...defaultAddress },
    });
    setActiveTab("basic");
    setIsDialogOpen(true);
  };

  const handleEdit = (church: Church) => {
    setFormState({
      name: church.name || "",
      diocese: church.diocese || "",
      address: normalizeAddress(church.address),
    });
    setSelectedChurch(church);
    setActiveTab("basic");
    setIsDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!formState.name || !formState.diocese) {
      toast.error(t("Church name and diocese are required fields"));
      return;
    }

    setIsSubmitting(true);

    try {
      if (selectedChurch) {
        const updatePayload = {
          name: formState.name,
          diocese: formState.diocese,
          address: formState.address,
        };
        await updateChurch(selectedChurch.id, updatePayload);
        toast.success("Church updated successfully!");
      } else {
        await createChurch(formState);
        toast.success("Church created successfully!");
      }

      await loadChurches();
      setIsDialogOpen(false);
    } catch (err: any) {
      toast.error(err.message || "Operation failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedChurch) return;

    setIsSubmitting(true);
    try {
      await deactivateChurch(selectedChurch.id);
      toast.success("Church deactivated successfully!");
      await loadChurches();
    } catch (err: any) {
      toast.error(err.message || "Deactivation failed");
    } finally {
      setIsSubmitting(false);
      setIsDeleteDialogOpen(false);
    }
  };

  const updateAddressField = (field: keyof Address, value: string) => {
    setFormState({
      ...formState,
      address: {
        ...formState.address,
        [field]: value,
      },
    });
  };

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold">{t("Churches")}</h1>
            <p className="text-muted-foreground">{t("Manage churches and their locations")}</p>
          </div>
          <Button onClick={handleAdd} size="lg">
            <Plus className="h-5 w-5 mr-2" /> {t("Add Church")}
          </Button>
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t("Search by name, diocese, or city...")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button variant="outline" size="icon" onClick={() => loadChurches()} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <DataTable columns={columns} data={filteredChurches} clientPageSize={10} />
        )}

        {/* Add/Edit Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-2xl">
                {selectedChurch ? t("Edit Church") : t("Add New Church")}
              </DialogTitle>
            </DialogHeader>
            
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="basic">Basic Information</TabsTrigger>
                <TabsTrigger value="address">Address Details</TabsTrigger>
              </TabsList>
              
              <TabsContent value="basic" className="space-y-4 py-4">
                <div>
                  <Label>{t("Church Name")} *</Label>
                  <Input
                    value={formState.name}
                    onChange={(e) => setFormState({ ...formState, name: e.target.value })}
                    placeholder={t("e.g. St. Mary Church")}
                  />
                </div>
                <div>
                  <Label>{t("Diocese")} *</Label>
                  <SearchableSelect
                    value={formState.diocese}
                    onChange={(value) => setFormState({ ...formState, diocese: value })}
                    options={[
                      ...dioceses.map((d) => ({ value: d.name, label: d.name })),
                      ...(formState.diocese && !dioceses.some((d) => d.name === formState.diocese)
                        ? [{ value: formState.diocese, label: formState.diocese }]
                        : []),
                    ]}
                    placeholder={t("Select a diocese")}
                    searchPlaceholder={t("Search dioceses...")}
                    emptyText={t("No dioceses found")}
                  />
                </div>
              </TabsContent>
              
              <TabsContent value="address" className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>{t("Country")}</Label>
                    <Input
                      value={formState.address.country}
                      onChange={(e) => updateAddressField("country", e.target.value)}
                      placeholder="Ethiopia"
                    />
                  </div>
                  <div>
                    <Label>{t("Region")}</Label>
                    <Input
                      value={formState.address.region}
                      onChange={(e) => updateAddressField("region", e.target.value)}
                      placeholder={t("e.g. Oromia")}
                    />
                  </div>
                  <div>
                    <Label>{t("Zone")}</Label>
                    <Input
                      value={formState.address.zone}
                      onChange={(e) => updateAddressField("zone", e.target.value)}
                      placeholder={t("e.g. East Shewa")}
                    />
                  </div>
                  <div>
                    <Label>{t("City")}</Label>
                    <Input
                      value={formState.address.city}
                      onChange={(e) => updateAddressField("city", e.target.value)}
                      placeholder={t("e.g. Addis Ababa")}
                    />
                  </div>
                  <div>
                    <Label>{t("Subcity")}</Label>
                    <Input
                      value={formState.address.subcity}
                      onChange={(e) => updateAddressField("subcity", e.target.value)}
                      placeholder={t("e.g. Bole")}
                    />
                  </div>
                  <div>
                    <Label>{t("District")}</Label>
                    <Input
                      value={formState.address.district}
                      onChange={(e) => updateAddressField("district", e.target.value)}
                      placeholder={t("e.g. District 5")}
                    />
                  </div>
                  <div>
                    <Label>{t("Woreda")}</Label>
                    <Input
                      value={formState.address.woreda}
                      onChange={(e) => updateAddressField("woreda", e.target.value)}
                      placeholder={t("e.g. Woreda 03")}
                    />
                  </div>
                  <div>
                    <Label>{t("Kebele")}</Label>
                    <Input
                      value={formState.address.kebele}
                      onChange={(e) => updateAddressField("kebele", e.target.value)}
                      placeholder={t("e.g. Kebele 16")}
                    />
                  </div>
                  <div>
                    <Label>{t("House Number")}</Label>
                    <Input
                      value={formState.address.houseNumber}
                      onChange={(e) => updateAddressField("houseNumber", e.target.value)}
                      placeholder={t("e.g. 123")}
                    />
                  </div>
                  <div>
                    <Label>{t("Street")}</Label>
                    <Input
                      value={formState.address.street}
                      onChange={(e) => updateAddressField("street", e.target.value)}
                      placeholder={t("e.g. Bole Road")}
                    />
                  </div>
                  <div className="col-span-2">
                    <Label>{t("Additional Information")}</Label>
                    <Textarea
                      value={formState.address.additionalInfo}
                      onChange={(e) => updateAddressField("additionalInfo", e.target.value)}
                      placeholder={t("Any additional location notes...")}
                      rows={2}
                    />
                  </div>
                </div>
              </TabsContent>
            </Tabs>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)} disabled={isSubmitting}>
                {t("Cancel")}
              </Button>
              {activeTab === "basic" && (
                <Button type="button" variant={selectedChurch ? "outline" : "default"} onClick={() => setActiveTab("address")}>
                  {t("Next")}
                </Button>
              )}
              {(activeTab === "address" || selectedChurch) && (
                <Button onClick={handleSubmit} disabled={isSubmitting}>
                  {isSubmitting ? t("Saving...") : selectedChurch ? t("Update") : t("Create")}
                </Button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* View Details Dialog */}
        <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
          <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-2xl flex items-center gap-2">
                <House className="h-6 w-6 text-primary" /> {selectedChurch?.name}
              </DialogTitle>
            </DialogHeader>
            {selectedChurch && (
              <div className="space-y-5 py-2">
                {viewLoading && <p className="text-xs text-muted-foreground">{t("Loading...")}</p>}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">{t("Diocese")}</p>
                    <p className="font-semibold">{selectedChurch.diocese || "-"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">{t("Status")}</p>
                    <Badge className={isChurchActive(selectedChurch) ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>
                      {isChurchActive(selectedChurch) ? t("ACTIVE") : t("INACTIVE")}
                    </Badge>
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold mb-2 flex items-center gap-2">
                    <MapPin className="h-4 w-4" /> {t("Address Details")}
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    {([
                      ["Country", "country"],
                      ["Region", "region"],
                      ["Zone", "zone"],
                      ["City", "city"],
                      ["Subcity", "subcity"],
                      ["District", "district"],
                      ["Woreda", "woreda"],
                      ["Kebele", "kebele"],
                      ["House Number", "houseNumber"],
                      ["Street", "street"],
                    ] as [string, keyof Address][]).map(([label, key]) => (
                      <div key={key}>
                        <p className="text-sm text-muted-foreground">{t(label)}</p>
                        <p className="font-semibold">{(selectedChurch.address as any)?.[key] || "-"}</p>
                      </div>
                    ))}
                    {selectedChurch.address?.additionalInfo && (
                      <div className="col-span-2">
                        <p className="text-sm text-muted-foreground">{t("Additional Information")}</p>
                        <p className="font-semibold">{selectedChurch.address.additionalInfo}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsViewDialogOpen(false)}>
                {t("Close")}
              </Button>
              <Button
                onClick={() => {
                  setIsViewDialogOpen(false);
                  const c = selectedChurch;
                  if (c) afterMenuClose(() => handleEdit(c));
                }}
              >
                <Edit className="h-4 w-4 mr-2" /> {t("Edit")}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t("Deactivate Church?")}</DialogTitle>
            </DialogHeader>
            <p className="text-muted-foreground">
              {t("Are you sure you want to deactivate")} <strong>{selectedChurch?.name}</strong>?
              {t("This church will be marked as inactive and won't be available for use.")}
            </p>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
                {t("Cancel")}
              </Button>
              <Button variant="destructive" onClick={handleDelete} disabled={isSubmitting}>
                {isSubmitting ? t("Deactivating...") : t("Deactivate")}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
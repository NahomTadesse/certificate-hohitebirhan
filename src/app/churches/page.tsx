"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import {
  Building,
  Plus,
  Edit,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";

import DashboardLayout from "../dashboard/layout";
import {
  fetchChurches,
  createChurch,
  updateChurch,
  deactivateChurch,
  Church,
  Address,
} from "@/services/churchService";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";

export default function ChurchManagement() {
  const [churches, setChurches] = useState<Church[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [alert, setAlert] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
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
    addressType: "EMERGENCY_CONTACT",
  };

  const [formState, setFormState] = useState({
    name: "",
    diocese: "",
    address: defaultAddress,
  });

  const loadChurches = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetchChurches(0, 100);
      setChurches(response.data || []);
    } catch (err: any) {
      setError("Failed to load churches. " + err.message);
      setChurches([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadChurches();
  }, [loadChurches]);

  const filteredChurches = useMemo(() => {
    return churches.filter((church) =>
      church.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      church.diocese.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (church.address.city && church.address.city.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  }, [churches, searchQuery]);

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
            <div className="text-sm text-muted-foreground">Diocese: {row.original.diocese}</div>
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
      cell: ({ row }) => (
        <Badge
          className={
            row.original.isActive !== false
              ? "bg-green-100 text-green-800"
              : "bg-red-100 text-red-800"
          }
        >
          {row.original.isActive !== false ? "ACTIVE" : "INACTIVE"}
        </Badge>
      ),
    },
    {
      id: "actions",
      cell: ({ row }) => (
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => handleEdit(row.original)}
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="text-red-600 hover:text-red-700 hover:bg-red-50"
            onClick={() => {
              setSelectedChurch(row.original);
              setIsDeleteDialogOpen(true);
            }}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
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
      name: church.name,
      diocese: church.diocese,
      address: church.address || { ...defaultAddress },
    });
    setSelectedChurch(church);
    setIsDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!formState.name || !formState.diocese) {
      setAlert({ type: "error", message: "Church name and diocese are required fields" });
      return;
    }

    setIsSubmitting(true);
    setAlert(null);

    try {
      if (selectedChurch) {
        const updatePayload = {
          name: formState.name,
          diocese: formState.diocese,
          address: formState.address,
        };
        await updateChurch(selectedChurch.id, updatePayload);
        setAlert({ type: "success", message: "Church updated successfully!" });
      } else {
        await createChurch(formState);
        setAlert({ type: "success", message: "Church created successfully!" });
      }

      await loadChurches();
      setIsDialogOpen(false);
      setTimeout(() => setAlert(null), 3000);
    } catch (err: any) {
      setAlert({ type: "error", message: err.message || "Operation failed" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedChurch) return;

    setIsSubmitting(true);
    try {
      await deactivateChurch(selectedChurch.id);
      setAlert({ type: "success", message: "Church deactivated successfully!" });
      await loadChurches();
      setTimeout(() => setAlert(null), 3000);
    } catch (err: any) {
      setAlert({ type: "error", message: err.message || "Deactivation failed" });
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
              placeholder={t("Search by name, diocese, or city...")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button variant="outline" size="icon" onClick={loadChurches} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <DataTable columns={columns} data={filteredChurches} />
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
                  <Input
                    value={formState.diocese}
                    onChange={(e) => setFormState({ ...formState, diocese: e.target.value })}
                    placeholder={t("e.g. Addis Ababa Diocese")}
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
              <Button onClick={handleSubmit} disabled={isSubmitting}>
                {isSubmitting ? t("Saving...") : selectedChurch ? t("Update") : t("Create")}
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
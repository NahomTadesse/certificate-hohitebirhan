// "use client";

// import { useState, useEffect, useCallback, useMemo } from "react";
// import {
//   Users,
//   Plus,
//   Edit,
//   Trash2,
//   Search,
//   RefreshCw,
//   AlertCircle,
//   CheckCircle,
//   XCircle,
//   Phone,
//   Calendar,
//   BookOpen,
//   Briefcase,
//   Church,
//   GraduationCap,
//   User,
//   ArrowRightLeft,
//   Power,
//   Award,
//   Landmark,
//   Filter,
// } from "lucide-react";

// import { ColumnDef } from "@tanstack/react-table";
// import { DataTable } from "@/components/ui/DataTable";
// import { Button } from "@/components/ui/button";
// import { Input } from "@/components/ui/input";
// import { Label } from "@/components/ui/label";
// import { Badge } from "@/components/ui/badge";
// import { Alert, AlertDescription } from "@/components/ui/alert";
// import {
//   Dialog,
//   DialogContent,
//   DialogHeader,
//   DialogTitle,
//   DialogFooter,
// } from "@/components/ui/dialog";
// import {
//   Select,
//   SelectContent,
//   SelectItem,
//   SelectTrigger,
//   SelectValue,
// } from "@/components/ui/select";
// import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
// import { Textarea } from "@/components/ui/textarea";

// import DashboardLayout from "../dashboard/layout";
// import {
//   fetchFathers,
//   createFather,
//   deleteFather,
//   transferFather,
//   deactivateFather,
//   fetchFathersByRank,
//   fetchFathersByMonasticism,
//   fetchFathersByDiocese,
//   Father,
//   SpiritualInfo,
//   ServiceHistory,
//   Education,
// } from "@/services/fatherService";
// import { fetchChurchesForDropdown } from "@/services/churchService";
// import { fetchDiocesesForDropdown } from "@/services/dioceseService";
// import { useRouter } from "next/navigation";
// import { useTranslation } from "react-i18next";

// const CLERICAL_RANKS = [
//   "DEACON",
//   "PRIEST",
//   "ARCHPRIEST",
//   "MONK_DEACON",
//   "MONK_PRIEST",
//   "HEGUMEN",
//   "ARCHIMANDRITE",
//   "BISHOP",
//   "ARCHBISHOP",
//   "PATRIARCH",
// ];

// const MONASTICISM_TYPES = ["SECULAR", "MONK"];

// export default function FatherManagement() {
//   const [fathers, setFathers] = useState<Father[]>([]);
//   const [churches, setChurches] = useState<{ id: string; name: string }[]>([]);
//   const [dioceses, setDioceses] = useState<{ id: string; name: string }[]>([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState<string | null>(null);
//   const [alert, setAlert] = useState<{ type: "success" | "error"; message: string } | null>(null);
//   const router = useRouter();
//   const [searchQuery, setSearchQuery] = useState("");
//   const [rankFilter, setRankFilter] = useState("ALL");
//   const [monasticismFilter, setMonasticismFilter] = useState("ALL");
//   const [isDialogOpen, setIsDialogOpen] = useState(false);
//   const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
//   const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
//   const [isTransferDialogOpen, setIsTransferDialogOpen] = useState(false);
//   const [isDeactivateDialogOpen, setIsDeactivateDialogOpen] = useState(false);
//   const [selectedFather, setSelectedFather] = useState<Father | null>(null);
//   const [transferChurchId, setTransferChurchId] = useState("");
//   const [isSubmitting, setIsSubmitting] = useState(false);
//   const [activeTab, setActiveTab] = useState("basic");
//   const { t } = useTranslation();

//   const defaultSpiritualInfo: SpiritualInfo = {
//     kinetPlace: "",
//     kinetDate: "",
//     currentChurchStartDate: "",
//     role: "",
//     startDate: "",
//     endDate: "",
//     numberOfChildren: 0,
//   };

//   const defaultServiceHistory: ServiceHistory = {
//     churchName: "",
//     startDate: "",
//     endDate: "",
//   };

//   const defaultEducation: Education = {
//     institutionName: "",
//     fieldOfStudy: "",
//     startDate: "",
//     endDate: "",
//   };

//   const [formState, setFormState] = useState({
//     firstName: "",
//     middleName: "",
//     lastName: "",
//     phoneNumber: "",
//     churchId: "",
//     dioceseId: "",
//     clericalRank: "PRIEST",
//     monasticismType: "SECULAR",
//     monasticName: "",
//     spiritualInfo: [defaultSpiritualInfo],
//     serviceHistory: [defaultServiceHistory],
//     educationList: [defaultEducation],
//   });

// const loadData = useCallback(async () => {
//   setLoading(true);
//   setError(null);
//   try {
//     const [fathersData, churchesData, diocesesData] = await Promise.all([
//       fetchFathers(),
//       fetchChurchesForDropdown(),
//       fetchDiocesesForDropdown(),
//     ]);
    
//     // Extract and transform the data
//     let fathersArray = [];
//     if (fathersData) {
//       if (Array.isArray(fathersData)) {
//         fathersArray = fathersData;
//       } else if (fathersData.content && Array.isArray(fathersData.content)) {
//         // Transform the data to include fullName
//         fathersArray = fathersData.content.map((father: any) => ({
//           ...father,
//           fullName: [father.firstName, father.middleName, father.lastName]
//             .filter(Boolean) // Remove null/undefined
//             .join(' ')
//         }));
//       } else {
//         fathersArray = [];
//       }
//     }
    
//     setFathers(fathersArray);
//     setChurches(churchesData || []);
//     setDioceses(diocesesData || []);
//   } catch (err: any) {
//     console.error('Error loading data:', err);
//     setError("Failed to load data. " + err.message);
//     setFathers([]);
//   } finally {
//     setLoading(false);
//   }
// }, []);

//   useEffect(() => {
//     loadData();
//   }, [loadData]);

//   const normalizeFatherPage = (data: any) => {
//     if (!data) return [];
//     const content = Array.isArray(data) ? data : data.content;
//     if (!Array.isArray(content)) return [];
//     return content.map((father: any) => ({
//       ...father,
//       fullName:
//         father.fullName ||
//         [father.firstName, father.middleName, father.lastName].filter(Boolean).join(" "),
//     }));
//   };

//   const applyFilters = useCallback(
//     async (rank: string, monasticism: string) => {
//       // If both filters are ALL, just reload the full list
//       if (rank === "ALL" && monasticism === "ALL") {
//         await loadData();
//         return;
//       }
//       setLoading(true);
//       setError(null);
//       try {
//         let result: any = null;
//         if (rank !== "ALL") {
//           result = await fetchFathersByRank(rank);
//         } else if (monasticism !== "ALL") {
//           result = await fetchFathersByMonasticism(monasticism);
//         }
//         let list = normalizeFatherPage(result);
//         // If both set, further narrow client-side by monasticism/rank
//         if (rank !== "ALL" && monasticism !== "ALL") {
//           list = list.filter((f: any) => f.monasticismType === monasticism);
//         }
//         setFathers(list);
//       } catch (err: any) {
//         setError("Failed to filter fathers. " + err.message);
//         setFathers([]);
//       } finally {
//         setLoading(false);
//       }
//     },
//     [loadData]
//   );

//   useEffect(() => {
//     applyFilters(rankFilter, monasticismFilter);
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, [rankFilter, monasticismFilter]);

//  const filteredFathers = useMemo(() => {
//   if (!Array.isArray(fathers)) {
//     return [];
//   }
  
//   const query = searchQuery.toLowerCase().trim();
//   if (!query) {
//     return fathers;
//   }
  
//   return fathers.filter((father) => {
//     const fullName = father.fullName?.toLowerCase() || '';
//     const phone = father.phoneNumber?.toLowerCase() || '';
//     const church = father.churchName?.toLowerCase() || '';
    
//     return fullName.includes(query) || 
//            phone.includes(query) || 
//            church.includes(query);
//   });
// }, [fathers, searchQuery]);

//   const columns: ColumnDef<Father>[] = [
//     {
//       accessorKey: "fullName",
//       header: t("Father Name"),
//       cell: ({ row }) => (
//         <div className="flex items-center gap-3">
//           <div className="p-2 bg-primary/10 rounded-lg">
//             <User className="h-5 w-5 text-primary" />
//           </div>
//           <div>
//             <div className="font-semibold">{row.original.fullName}</div>
//             <div className="text-sm text-muted-foreground">ID: {row.original.id}</div>
//           </div>
//         </div>
//       ),
//     },
//     {
//       accessorKey: "phoneNumber",
//       header: t("Phone"),
//       cell: ({ row }) => (
//         <div className="flex items-center gap-2">
//           <Phone className="h-3 w-3 text-muted-foreground" />
//           <span className="text-sm">{row.original.phoneNumber || "-"}</span>
//         </div>
//       ),
//     },
//     {
//       accessorKey: "churchName",
//       header: t("Church"),
//       cell: ({ row }) => (
//         <div className="flex items-center gap-2">
//           <Church className="h-3 w-3 text-muted-foreground" />
//           <span className="text-sm">{row.original.churchName || "-"}</span>
//         </div>
//       ),
//     },
//     // {
//     //   accessorKey: "spiritualInfo",
//     //   header: t("Children Count"),
//     //   cell: ({ row }) => (
//     //     <div className="flex items-center gap-2">
//     //       <Users className="h-3 w-3 text-muted-foreground" />
//     //       <span className="text-sm font-semibold">
//     //         {row.original.spiritualInfo?.[0]?.numberOfChildren || 0} children
//     //       </span>
//     //     </div>
//     //   ),
//     // },
//     {
//       accessorKey: "clericalRank",
//       header: t("Rank"),
//       cell: ({ row }) => (
//         <div className="flex items-center gap-2">
//           <Award className="h-3 w-3 text-muted-foreground" />
//           <span className="text-sm">{row.original.clericalRankLabel || row.original.clericalRank || "-"}</span>
//         </div>
//       ),
//     },
//     {
//       accessorKey: "dioceseName",
//       header: t("Diocese"),
//       cell: ({ row }) => (
//         <div className="flex items-center gap-2">
//           <Landmark className="h-3 w-3 text-muted-foreground" />
//           <span className="text-sm">{row.original.dioceseName || "-"}</span>
//         </div>
//       ),
//     },
//     {
//       accessorKey: "active",
//       header: t("Status"),
//       cell: ({ row }) => (
//         <Badge
//           className={
//             row.original.active
//               ? "bg-green-100 text-green-800"
//               : "bg-red-100 text-red-800"
//           }
//         >
//           {row.original.active ? "ACTIVE" : "INACTIVE"}
//         </Badge>
//       ),
//     },
//     {
//       id: "actions",
//       cell: ({ row }) => (
//         <div className="flex gap-2">
//           <Button
//             size="sm"
//             variant="ghost"
//             onClick={() => {
//               setSelectedFather(row.original);
//               setIsViewDialogOpen(true);
//             }}
//           >
//             View
//           </Button>
//           <Button
//             size="sm"
//             variant="ghost"
//             title={t("Transfer to another church")}
//             onClick={() => {
//               setSelectedFather(row.original);
//               setTransferChurchId("");
//               setIsTransferDialogOpen(true);
//             }}
//           >
//             <ArrowRightLeft className="h-4 w-4" />
//           </Button>
//           <Button
//             size="sm"
//             variant="ghost"
//             className="text-amber-600 hover:text-amber-700 hover:bg-amber-50"
//             title={t("Deactivate")}
//             onClick={() => {
//               setSelectedFather(row.original);
//               setIsDeactivateDialogOpen(true);
//             }}
//           >
//             <Power className="h-4 w-4" />
//           </Button>
//           <Button
//             size="sm"
//             variant="ghost"
//             className="text-red-600 hover:text-red-700 hover:bg-red-50"
//             onClick={() => {
//               setSelectedFather(row.original);
//               setIsDeleteDialogOpen(true);
//             }}
//           >
//             <Trash2 className="h-4 w-4" />
//           </Button>
//         </div>
//       ),
//     },
//   ];

//   const handleAdd = () => {
//     setFormState({
//       firstName: "",
//       middleName: "",
//       lastName: "",
//       phoneNumber: "",
//       churchId: "",
//       dioceseId: "",
//       clericalRank: "PRIEST",
//       monasticismType: "SECULAR",
//       monasticName: "",
//       spiritualInfo: [defaultSpiritualInfo],
//       serviceHistory: [defaultServiceHistory],
//       educationList: [defaultEducation],
//     });
//     setActiveTab("basic");
//     setIsDialogOpen(true);
//   };

//   const handleTransfer = async () => {
//     if (!selectedFather || !transferChurchId) {
//       setAlert({ type: "error", message: "Please select a destination church." });
//       return;
//     }
//     setIsSubmitting(true);
//     try {
//       await transferFather(selectedFather.id, transferChurchId);
//       setAlert({ type: "success", message: "Father transferred successfully!" });
//       await applyFilters(rankFilter, monasticismFilter);
//       setTimeout(() => setAlert(null), 3000);
//     } catch (err: any) {
//       setAlert({ type: "error", message: err.message || "Transfer failed" });
//     } finally {
//       setIsSubmitting(false);
//       setIsTransferDialogOpen(false);
//     }
//   };

//   const handleDeactivate = async () => {
//     if (!selectedFather) return;
//     setIsSubmitting(true);
//     try {
//       await deactivateFather(selectedFather.id);
//       setAlert({ type: "success", message: "Father deactivated successfully!" });
//       await applyFilters(rankFilter, monasticismFilter);
//       setTimeout(() => setAlert(null), 3000);
//     } catch (err: any) {
//       setAlert({ type: "error", message: err.message || "Deactivation failed" });
//     } finally {
//       setIsSubmitting(false);
//       setIsDeactivateDialogOpen(false);
//     }
//   };

//   const addSpiritualInfo = () => {
//     setFormState({
//       ...formState,
//       spiritualInfo: [...formState.spiritualInfo, defaultSpiritualInfo],
//     });
//   };

//   const removeSpiritualInfo = (index: number) => {
//     setFormState({
//       ...formState,
//       spiritualInfo: formState.spiritualInfo.filter((_, i) => i !== index),
//     });
//   };

//   const updateSpiritualInfo = (index: number, field: keyof SpiritualInfo, value: any) => {
//     const updated = [...formState.spiritualInfo];
//     updated[index] = { ...updated[index], [field]: value };
//     setFormState({ ...formState, spiritualInfo: updated });
//   };

//   const addServiceHistory = () => {
//     setFormState({
//       ...formState,
//       serviceHistory: [...formState.serviceHistory, defaultServiceHistory],
//     });
//   };

//   const removeServiceHistory = (index: number) => {
//     setFormState({
//       ...formState,
//       serviceHistory: formState.serviceHistory.filter((_, i) => i !== index),
//     });
//   };

//   const updateServiceHistory = (index: number, field: keyof ServiceHistory, value: string) => {
//     const updated = [...formState.serviceHistory];
//     updated[index] = { ...updated[index], [field]: value };
//     setFormState({ ...formState, serviceHistory: updated });
//   };

//   const addEducation = () => {
//     setFormState({
//       ...formState,
//       educationList: [...formState.educationList, defaultEducation],
//     });
//   };

//   const removeEducation = (index: number) => {
//     setFormState({
//       ...formState,
//       educationList: formState.educationList.filter((_, i) => i !== index),
//     });
//   };

//   const updateEducation = (index: number, field: keyof Education, value: string) => {
//     const updated = [...formState.educationList];
//     updated[index] = { ...updated[index], [field]: value };
//     setFormState({ ...formState, educationList: updated });
//   };

//   const handleSubmit = async () => {
//     if (!formState.firstName || !formState.lastName || !formState.churchId) {
//       setAlert({ type: "error", message: "Please fill all required fields" });
//       return;
//     }

//     setIsSubmitting(true);
//     setAlert(null);

//     try {
//       await createFather(formState);
//       setAlert({ type: "success", message: "Father registered successfully!" });
//       await loadData();
//       setIsDialogOpen(false);
//       setTimeout(() => setAlert(null), 3000);
//     } catch (err: any) {
//       setAlert({ type: "error", message: err.message || "Operation failed" });
//     } finally {
//       setIsSubmitting(false);
//     }
//   };

//   const handleDelete = async () => {
//     if (!selectedFather) return;

//     setIsSubmitting(true);
//     try {
//       await deleteFather(selectedFather.id);
//       setAlert({ type: "success", message: "Father deleted successfully!" });
//       await loadData();
//       setTimeout(() => setAlert(null), 3000);
//     } catch (err: any) {
//       setAlert({ type: "error", message: err.message || "Delete failed" });
//     } finally {
//       setIsSubmitting(false);
//       setIsDeleteDialogOpen(false);
//     }
//   };

//   return (
//     <DashboardLayout>
//       <div className="p-6 space-y-6">
//         <div className="flex justify-between items-start">
//           <div>
//             <h1 className="text-3xl font-bold">{t("Fathers")}</h1>
//             <p className="text-muted-foreground">{t("Manage spiritual fathers and their information")}</p>
//           </div>
//           <Button onClick={handleAdd} size="lg">
//             <Plus className="h-5 w-5 mr-2" /> {t("Add Father")}
//           </Button>
//         </div>

//         {error && (
//           <Alert variant="destructive">
//             <AlertCircle className="h-4 w-4" />
//             <AlertDescription>{error}</AlertDescription>
//           </Alert>
//         )}

//         {alert && (
//           <Alert variant={alert.type === "error" ? "destructive" : "default"}>
//             {alert.type === "success" ? <CheckCircle className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
//             <AlertDescription>{alert.message}</AlertDescription>
//           </Alert>
//         )}

//         <div className="flex flex-col sm:flex-row gap-4">
//           <div className="relative flex-1 max-w-md">
//             <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
//             <Input
//               placeholder={t("Search by name, phone, or church...")}
//               value={searchQuery}
//               onChange={(e) => setSearchQuery(e.target.value)}
//               className="pl-10"
//             />
//           </div>
//           <Select value={rankFilter} onValueChange={setRankFilter}>
//             <SelectTrigger className="w-full sm:w-48">
//               <Filter className="h-3.5 w-3.5 mr-1 text-muted-foreground" />
//               <SelectValue placeholder={t("Filter by rank")} />
//             </SelectTrigger>
//             <SelectContent>
//               <SelectItem value="ALL">{t("All Ranks")}</SelectItem>
//               {CLERICAL_RANKS.map((r) => (
//                 <SelectItem key={r} value={r}>
//                   {r}
//                 </SelectItem>
//               ))}
//             </SelectContent>
//           </Select>
//           <Select value={monasticismFilter} onValueChange={setMonasticismFilter}>
//             <SelectTrigger className="w-full sm:w-48">
//               <SelectValue placeholder={t("Filter by type")} />
//             </SelectTrigger>
//             <SelectContent>
//               <SelectItem value="ALL">{t("All Types")}</SelectItem>
//               {MONASTICISM_TYPES.map((m) => (
//                 <SelectItem key={m} value={m}>
//                   {m}
//                 </SelectItem>
//               ))}
//             </SelectContent>
//           </Select>
//           <Button variant="outline" size="icon" onClick={() => applyFilters(rankFilter, monasticismFilter)} disabled={loading}>
//             <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
//           </Button>
//         </div>

//         {loading ? (
//           <div className="flex justify-center items-center h-64">
//             <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
//           </div>
//         ) : (
//           <DataTable columns={columns} data={filteredFathers} />
//         )}

//         {/* Add Father Dialog */}
//         <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
//           <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
//             <DialogHeader>
//               <DialogTitle className="text-2xl">{t("Register New Father")}</DialogTitle>
//             </DialogHeader>
            
//             <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
//               <TabsList className="grid w-full grid-cols-4">
//                 <TabsTrigger value="basic">Basic Info</TabsTrigger>
//                 <TabsTrigger value="spiritual">Spiritual Info</TabsTrigger>
//                 <TabsTrigger value="service">Service History</TabsTrigger>
//                 <TabsTrigger value="education">Education</TabsTrigger>
//               </TabsList>
              
//               <TabsContent value="basic" className="space-y-4 py-4">
//                 <div className="grid grid-cols-2 gap-4">
//                   <div>
//                     <Label>{t("First Name")} *</Label>
//                     <Input
//                       value={formState.firstName}
//                       onChange={(e) => setFormState({ ...formState, firstName: e.target.value })}
//                     />
//                   </div>
//                   <div>
//                     <Label>{t("Middle Name")}</Label>
//                     <Input
//                       value={formState.middleName}
//                       onChange={(e) => setFormState({ ...formState, middleName: e.target.value })}
//                     />
//                   </div>
//                 </div>
//                 <div>
//                   <Label>{t("Last Name")} *</Label>
//                   <Input
//                     value={formState.lastName}
//                     onChange={(e) => setFormState({ ...formState, lastName: e.target.value })}
//                   />
//                 </div>
//                 <div>
//                   <Label>{t("Phone Number")}</Label>
//                   <Input
//                     type="tel"
//                     value={formState.phoneNumber}
//                     onChange={(e) => setFormState({ ...formState, phoneNumber: e.target.value })}
//                   />
//                 </div>
//                 <div>
//                   <Label>{t("Church")} *</Label>
//                   <Select
//                     value={formState.churchId}
//                     onValueChange={(v) => setFormState({ ...formState, churchId: v })}
//                   >
//                     <SelectTrigger>
//                       <SelectValue placeholder="Select church" />
//                     </SelectTrigger>
//                     <SelectContent>
//                       {churches.map((church) => (
//                         <SelectItem key={church.id} value={church.id}>
//                           {church.name}
//                         </SelectItem>
//                       ))}
//                     </SelectContent>
//                   </Select>
//                 </div>
//                 <div>
//                   <Label>{t("Diocese")}</Label>
//                   <Select
//                     value={formState.dioceseId}
//                     onValueChange={(v) => setFormState({ ...formState, dioceseId: v })}
//                   >
//                     <SelectTrigger>
//                       <SelectValue placeholder={t("Select diocese")} />
//                     </SelectTrigger>
//                     <SelectContent>
//                       {dioceses.map((d) => (
//                         <SelectItem key={d.id} value={d.id}>
//                           {d.name}
//                         </SelectItem>
//                       ))}
//                     </SelectContent>
//                   </Select>
//                 </div>
//                 <div className="grid grid-cols-2 gap-4">
//                   <div>
//                     <Label>{t("Clerical Rank")}</Label>
//                     <Select
//                       value={formState.clericalRank}
//                       onValueChange={(v) => setFormState({ ...formState, clericalRank: v })}
//                     >
//                       <SelectTrigger>
//                         <SelectValue />
//                       </SelectTrigger>
//                       <SelectContent>
//                         {CLERICAL_RANKS.map((r) => (
//                           <SelectItem key={r} value={r}>
//                             {r}
//                           </SelectItem>
//                         ))}
//                       </SelectContent>
//                     </Select>
//                   </div>
//                   <div>
//                     <Label>{t("Monasticism Type")}</Label>
//                     <Select
//                       value={formState.monasticismType}
//                       onValueChange={(v) => setFormState({ ...formState, monasticismType: v })}
//                     >
//                       <SelectTrigger>
//                         <SelectValue />
//                       </SelectTrigger>
//                       <SelectContent>
//                         {MONASTICISM_TYPES.map((m) => (
//                           <SelectItem key={m} value={m}>
//                             {m}
//                           </SelectItem>
//                         ))}
//                       </SelectContent>
//                     </Select>
//                   </div>
//                 </div>
//                 {formState.monasticismType === "MONK" && (
//                   <div>
//                     <Label>{t("Monastic Name")}</Label>
//                     <Input
//                       value={formState.monasticName}
//                       onChange={(e) => setFormState({ ...formState, monasticName: e.target.value })}
//                       placeholder={t("e.g. Abba X")}
//                     />
//                   </div>
//                 )}
//               </TabsContent>
              
//               <TabsContent value="spiritual" className="space-y-4 py-4">
//                 {formState.spiritualInfo.map((info, index) => (
//                   <div key={index} className="border p-4 rounded-lg space-y-3">
//                     <div className="flex justify-between items-center">
//                       <Label className="font-semibold">Spiritual Info #{index + 1}</Label>
//                       {index > 0 && (
//                         <Button variant="ghost" size="sm" onClick={() => removeSpiritualInfo(index)}>
//                           Remove
//                         </Button>
//                       )}
//                     </div>
//                     <div className="grid grid-cols-2 gap-3">
//                       <div>
//                         <Label>Kinet Place</Label>
//                         <Input
//                           value={info.kinetPlace}
//                           onChange={(e) => updateSpiritualInfo(index, "kinetPlace", e.target.value)}
//                         />
//                       </div>
//                       <div>
//                         <Label>Kinet Date</Label>
//                         <Input
//                           type="date"
//                           value={info.kinetDate}
//                           onChange={(e) => updateSpiritualInfo(index, "kinetDate", e.target.value)}
//                         />
//                       </div>
//                       <div>
//                         <Label>Current Church Start Date</Label>
//                         <Input
//                           type="date"
//                           value={info.currentChurchStartDate}
//                           onChange={(e) => updateSpiritualInfo(index, "currentChurchStartDate", e.target.value)}
//                         />
//                       </div>
//                       <div>
//                         <Label>Role</Label>
//                         <Input
//                           value={info.role}
//                           onChange={(e) => updateSpiritualInfo(index, "role", e.target.value)}
//                         />
//                       </div>
//                       <div>
//                         <Label>Start Date</Label>
//                         <Input
//                           type="date"
//                           value={info.startDate}
//                           onChange={(e) => updateSpiritualInfo(index, "startDate", e.target.value)}
//                         />
//                       </div>
//                       <div>
//                         <Label>End Date</Label>
//                         <Input
//                           type="date"
//                           value={info.endDate}
//                           onChange={(e) => updateSpiritualInfo(index, "endDate", e.target.value)}
//                         />
//                       </div>
//                       <div>
//                         <Label>Number of Children</Label>
//                         <Input
//                           type="number"
//                           value={info.numberOfChildren}
//                           onChange={(e) => updateSpiritualInfo(index, "numberOfChildren", parseInt(e.target.value))}
//                         />
//                       </div>
//                     </div>
//                   </div>
//                 ))}
//                 <Button type="button" variant="outline" onClick={addSpiritualInfo} className="w-full">
//                   + Add Spiritual Info
//                 </Button>
//               </TabsContent>
              
//               <TabsContent value="service" className="space-y-4 py-4">
//                 {formState.serviceHistory.map((service, index) => (
//                   <div key={index} className="border p-4 rounded-lg space-y-3">
//                     <div className="flex justify-between items-center">
//                       <Label className="font-semibold">Service #{index + 1}</Label>
//                       {index > 0 && (
//                         <Button variant="ghost" size="sm" onClick={() => removeServiceHistory(index)}>
//                           Remove
//                         </Button>
//                       )}
//                     </div>
//                     <div>
//                       <Label>Church Name</Label>
//                       <Input
//                         value={service.churchName}
//                         onChange={(e) => updateServiceHistory(index, "churchName", e.target.value)}
//                       />
//                     </div>
//                     <div className="grid grid-cols-2 gap-3">
//                       <div>
//                         <Label>Start Date</Label>
//                         <Input
//                           type="date"
//                           value={service.startDate}
//                           onChange={(e) => updateServiceHistory(index, "startDate", e.target.value)}
//                         />
//                       </div>
//                       <div>
//                         <Label>End Date</Label>
//                         <Input
//                           type="date"
//                           value={service.endDate}
//                           onChange={(e) => updateServiceHistory(index, "endDate", e.target.value)}
//                         />
//                       </div>
//                     </div>
//                   </div>
//                 ))}
//                 <Button type="button" variant="outline" onClick={addServiceHistory} className="w-full">
//                   + Add Service History
//                 </Button>
//               </TabsContent>
              
//               <TabsContent value="education" className="space-y-4 py-4">
//                 {formState.educationList.map((edu, index) => (
//                   <div key={index} className="border p-4 rounded-lg space-y-3">
//                     <div className="flex justify-between items-center">
//                       <Label className="font-semibold">Education #{index + 1}</Label>
//                       {index > 0 && (
//                         <Button variant="ghost" size="sm" onClick={() => removeEducation(index)}>
//                           Remove
//                         </Button>
//                       )}
//                     </div>
//                     <div>
//                       <Label>Institution Name</Label>
//                       <Input
//                         value={edu.institutionName}
//                         onChange={(e) => updateEducation(index, "institutionName", e.target.value)}
//                       />
//                     </div>
//                     <div>
//                       <Label>Field of Study</Label>
//                       <Input
//                         value={edu.fieldOfStudy}
//                         onChange={(e) => updateEducation(index, "fieldOfStudy", e.target.value)}
//                       />
//                     </div>
//                     <div className="grid grid-cols-2 gap-3">
//                       <div>
//                         <Label>Start Date</Label>
//                         <Input
//                           type="date"
//                           value={edu.startDate}
//                           onChange={(e) => updateEducation(index, "startDate", e.target.value)}
//                         />
//                       </div>
//                       <div>
//                         <Label>End Date</Label>
//                         <Input
//                           type="date"
//                           value={edu.endDate}
//                           onChange={(e) => updateEducation(index, "endDate", e.target.value)}
//                         />
//                       </div>
//                     </div>
//                   </div>
//                 ))}
//                 <Button type="button" variant="outline" onClick={addEducation} className="w-full">
//                   + Add Education
//                 </Button>
//               </TabsContent>
//             </Tabs>

//             <DialogFooter>
//               <Button variant="outline" onClick={() => setIsDialogOpen(false)} disabled={isSubmitting}>
//                 {t("Cancel")}
//               </Button>
//               <Button onClick={handleSubmit} disabled={isSubmitting}>
//                 {isSubmitting ? t("Saving...") : t("Register")}
//               </Button>
//             </DialogFooter>
//           </DialogContent>
//         </Dialog>

//         {/* View Father Dialog */}
//         <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
//           <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
//             <DialogHeader>
//               <DialogTitle className="text-2xl">Father Details</DialogTitle>
//             </DialogHeader>
//             {selectedFather && (
//               <div className="space-y-4">
//                 <div className="grid grid-cols-2 gap-4">
//                   <div>
//                     <Label className="font-semibold">Full Name</Label>
//                     <p className="text-lg">{selectedFather.fullName}</p>
//                   </div>
//                   <div>
//                     <Label className="font-semibold">Phone</Label>
//                     <p>{selectedFather.phoneNumber || "-"}</p>
//                   </div>
//                   <div>
//                     <Label className="font-semibold">Church</Label>
//                     <p>{selectedFather.churchName || "-"}</p>
//                   </div>
//                   <div>
//                     <Label className="font-semibold">Status</Label>
//                     <Badge className={selectedFather.active ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>
//                       {selectedFather.active ? "ACTIVE" : "INACTIVE"}
//                     </Badge>
//                   </div>
//                 </div>

//                 {selectedFather.spiritualInfo && selectedFather.spiritualInfo.length > 0 && (
//                   <div>
//                     <Label className="font-semibold flex items-center gap-2">
//                       <Briefcase className="h-4 w-4" /> Spiritual Information
//                     </Label>
//                     <div className="mt-2 space-y-2">
//                       {selectedFather.spiritualInfo.map((info, idx) => (
//                         <div key={idx} className="bg-muted p-3 rounded-lg">
//                           <p><strong>Kinet Place:</strong> {info.kinetPlace}</p>
//                           <p><strong>Kinet Date:</strong> {info.kinetDate}</p>
//                           <p><strong>Role:</strong> {info.role}</p>
//                           <p><strong>Children Count:</strong> {info.numberOfChildren}</p>
//                         </div>
//                       ))}
//                     </div>
//                   </div>
//                 )}

//                 {selectedFather.serviceHistory && selectedFather.serviceHistory.length > 0 && (
//                   <div>
//                     <Label className="font-semibold flex items-center gap-2">
//                       <Church className="h-4 w-4" /> Service History
//                     </Label>
//                     <div className="mt-2 space-y-2">
//                       {selectedFather.serviceHistory.map((service, idx) => (
//                         <div key={idx} className="bg-muted p-3 rounded-lg">
//                           <p><strong>Church:</strong> {service.churchName}</p>
//                           <p><strong>Period:</strong> {service.startDate} - {service.endDate}</p>
//                         </div>
//                       ))}
//                     </div>
//                   </div>
//                 )}

//                 {selectedFather.educationList && selectedFather.educationList.length > 0 && (
//                   <div>
//                     <Label className="font-semibold flex items-center gap-2">
//                       <GraduationCap className="h-4 w-4" /> Education
//                     </Label>
//                     <div className="mt-2 space-y-2">
//                       {selectedFather.educationList.map((edu, idx) => (
//                         <div key={idx} className="bg-muted p-3 rounded-lg">
//                           <p><strong>Institution:</strong> {edu.institutionName}</p>
//                           <p><strong>Field:</strong> {edu.fieldOfStudy}</p>
//                           <p><strong>Period:</strong> {edu.startDate} - {edu.endDate}</p>
//                         </div>
//                       ))}
//                     </div>
//                   </div>
//                 )}

//                 {selectedFather.transferHistory && selectedFather.transferHistory.length > 0 && (
//                   <div>
//                     <Label className="font-semibold flex items-center gap-2">
//                       <RefreshCw className="h-4 w-4" /> Transfer History
//                     </Label>
//                     <div className="mt-2 space-y-2">
//                       {selectedFather.transferHistory.map((transfer, idx) => (
//                         <div key={idx} className="bg-muted p-3 rounded-lg">
//                           <p><strong>From:</strong> {transfer.fromChurchName}</p>
//                           <p><strong>To:</strong> {transfer.toChurchName}</p>
//                           <p><strong>Date:</strong> {new Date(transfer.transferDate).toLocaleString()}</p>
//                         </div>
//                       ))}
//                     </div>
//                   </div>
//                 )}
//               </div>
//             )}
//             <DialogFooter>
//               <Button onClick={() => setIsViewDialogOpen(false)}>Close</Button>
//             </DialogFooter>
//           </DialogContent>
//         </Dialog>

//         {/* Transfer Dialog */}
//         <Dialog open={isTransferDialogOpen} onOpenChange={setIsTransferDialogOpen}>
//           <DialogContent>
//             <DialogHeader>
//               <DialogTitle>{t("Transfer Father")}</DialogTitle>
//             </DialogHeader>
//             <p className="text-muted-foreground text-sm">
//               {t("Move")} <strong>{selectedFather?.fullName}</strong> {t("to a new church.")}
//             </p>
//             <div>
//               <Label>{t("New Church")} *</Label>
//               <Select value={transferChurchId} onValueChange={setTransferChurchId}>
//                 <SelectTrigger>
//                   <SelectValue placeholder={t("Select destination church")} />
//                 </SelectTrigger>
//                 <SelectContent>
//                   {churches.map((church) => (
//                     <SelectItem key={church.id} value={church.id}>
//                       {church.name}
//                     </SelectItem>
//                   ))}
//                 </SelectContent>
//               </Select>
//             </div>
//             <DialogFooter>
//               <Button variant="outline" onClick={() => setIsTransferDialogOpen(false)}>
//                 {t("Cancel")}
//               </Button>
//               <Button onClick={handleTransfer} disabled={isSubmitting}>
//                 {isSubmitting ? t("Transferring...") : t("Transfer")}
//               </Button>
//             </DialogFooter>
//           </DialogContent>
//         </Dialog>

//         {/* Deactivate Dialog */}
//         <Dialog open={isDeactivateDialogOpen} onOpenChange={setIsDeactivateDialogOpen}>
//           <DialogContent>
//             <DialogHeader>
//               <DialogTitle>{t("Deactivate Father?")}</DialogTitle>
//             </DialogHeader>
//             <p className="text-muted-foreground">
//               {t("Are you sure you want to deactivate")} <strong>{selectedFather?.fullName}</strong>?
//             </p>
//             <DialogFooter>
//               <Button variant="outline" onClick={() => setIsDeactivateDialogOpen(false)}>
//                 {t("Cancel")}
//               </Button>
//               <Button variant="destructive" onClick={handleDeactivate} disabled={isSubmitting}>
//                 {isSubmitting ? t("Deactivating...") : t("Deactivate")}
//               </Button>
//             </DialogFooter>
//           </DialogContent>
//         </Dialog>

//         {/* Delete Confirmation Dialog */}
//         <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
//           <DialogContent>
//             <DialogHeader>
//               <DialogTitle>{t("Delete Father?")}</DialogTitle>
//             </DialogHeader>
//             <p className="text-muted-foreground">
//               {t("Are you sure you want to delete")} <strong>{selectedFather?.fullName}</strong>?
//               {t("This action cannot be undone.")}
//             </p>
//             <DialogFooter>
//               <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
//                 {t("Cancel")}
//               </Button>
//               <Button variant="destructive" onClick={handleDelete} disabled={isSubmitting}>
//                 {isSubmitting ? t("Deleting...") : t("Delete")}
//               </Button>
//             </DialogFooter>
//           </DialogContent>
//         </Dialog>
//       </div>
//     </DashboardLayout>
//   );
// }

"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import {
  Users,
  Plus,
  Edit,
  Trash2,
  Search,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  XCircle,
  Phone,
  Calendar,
  BookOpen,
  Briefcase,
  Church,
  GraduationCap,
  User,
  ArrowRightLeft,
  Power,
  Award,
  Landmark,
  Filter,
  Eye,
  Info,
  Clock,
  Building2,
  UserCog,
  Hash,
  CalendarDays,
  MapPin,
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
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";

import DashboardLayout from "../dashboard/layout";
import {
  fetchFathers,
  createFather,
  deleteFather,
  transferFather,
  deactivateFather,
  fetchFathersByRank,
  fetchFathersByMonasticism,
  fetchFathersByDiocese,
  Father,
  SpiritualInfo,
  ServiceHistory,
  Education,
} from "@/services/fatherService";
import { fetchChurchesForDropdown } from "@/services/churchService";
import { fetchDiocesesForDropdown } from "@/services/dioceseService";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";

const CLERICAL_RANKS = [
  "DEACON",
  "PRIEST",
  "ARCHPRIEST",
  "MONK_DEACON",
  "MONK_PRIEST",
  "HEGUMEN",
  "ARCHIMANDRITE",
  "BISHOP",
  "ARCHBISHOP",
  "PATRIARCH",
];

const MONASTICISM_TYPES = ["SECULAR", "MONK"];

export default function FatherManagement() {
  const [fathers, setFathers] = useState<Father[]>([]);
  const [churches, setChurches] = useState<{ id: string; name: string }[]>([]);
  const [dioceses, setDioceses] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [alert, setAlert] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [rankFilter, setRankFilter] = useState("ALL");
  const [monasticismFilter, setMonasticismFilter] = useState("ALL");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isTransferDialogOpen, setIsTransferDialogOpen] = useState(false);
  const [isDeactivateDialogOpen, setIsDeactivateDialogOpen] = useState(false);
  const [selectedFather, setSelectedFather] = useState<Father | null>(null);
  const [transferChurchId, setTransferChurchId] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState("basic");
  const { t } = useTranslation();

  const defaultSpiritualInfo: SpiritualInfo = {
    kinetPlace: "",
    kinetDate: "",
    currentChurchStartDate: "",
    role: "",
    startDate: "",
    endDate: "",
    numberOfChildren: 0,
  };

  const defaultServiceHistory: ServiceHistory = {
    churchName: "",
    startDate: "",
    endDate: "",
  };

  const defaultEducation: Education = {
    institutionName: "",
    fieldOfStudy: "",
    startDate: "",
    endDate: "",
  };

  const [formState, setFormState] = useState({
    firstName: "",
    middleName: "",
    lastName: "",
    phoneNumber: "",
    churchId: "",
    dioceseId: "",
    clericalRank: "PRIEST",
    monasticismType: "SECULAR",
    monasticName: "",
    spiritualInfo: [defaultSpiritualInfo],
    serviceHistory: [defaultServiceHistory],
    educationList: [defaultEducation],
  });

const loadData = useCallback(async () => {
  setLoading(true);
  setError(null);
  try {
    const [fathersData, churchesData, diocesesData] = await Promise.all([
      fetchFathers(),
      fetchChurchesForDropdown(),
      fetchDiocesesForDropdown(),
    ]);
    
    // Extract and transform the data
    let fathersArray = [];
    if (fathersData) {
      if (Array.isArray(fathersData)) {
        fathersArray = fathersData;
      } else if (fathersData.content && Array.isArray(fathersData.content)) {
        // Transform the data to include fullName
        fathersArray = fathersData.content.map((father: any) => ({
          ...father,
          fullName: [father.firstName, father.middleName, father.lastName]
            .filter(Boolean) // Remove null/undefined
            .join(' ')
        }));
      } else {
        fathersArray = [];
      }
    }
    
    setFathers(fathersArray);
    setChurches(churchesData || []);
    setDioceses(diocesesData || []);
  } catch (err: any) {
    console.error('Error loading data:', err);
    setError("Failed to load data. " + err.message);
    setFathers([]);
  } finally {
    setLoading(false);
  }
}, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const normalizeFatherPage = (data: any) => {
    if (!data) return [];
    const content = Array.isArray(data) ? data : data.content;
    if (!Array.isArray(content)) return [];
    return content.map((father: any) => ({
      ...father,
      fullName:
        father.fullName ||
        [father.firstName, father.middleName, father.lastName].filter(Boolean).join(" "),
    }));
  };

  const applyFilters = useCallback(
    async (rank: string, monasticism: string) => {
      // If both filters are ALL, just reload the full list
      if (rank === "ALL" && monasticism === "ALL") {
        await loadData();
        return;
      }
      setLoading(true);
      setError(null);
      try {
        let result: any = null;
        if (rank !== "ALL") {
          result = await fetchFathersByRank(rank);
        } else if (monasticism !== "ALL") {
          result = await fetchFathersByMonasticism(monasticism);
        }
        let list = normalizeFatherPage(result);
        // If both set, further narrow client-side by monasticism/rank
        if (rank !== "ALL" && monasticism !== "ALL") {
          list = list.filter((f: any) => f.monasticismType === monasticism);
        }
        setFathers(list);
      } catch (err: any) {
        setError("Failed to filter fathers. " + err.message);
        setFathers([]);
      } finally {
        setLoading(false);
      }
    },
    [loadData]
  );

  useEffect(() => {
    applyFilters(rankFilter, monasticismFilter);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rankFilter, monasticismFilter]);

 const filteredFathers = useMemo(() => {
  if (!Array.isArray(fathers)) {
    return [];
  }
  
  const query = searchQuery.toLowerCase().trim();
  if (!query) {
    return fathers;
  }
  
  return fathers.filter((father) => {
    const fullName = father.fullName?.toLowerCase() || '';
    const phone = father.phoneNumber?.toLowerCase() || '';
    const church = father.churchName?.toLowerCase() || '';
    
    return fullName.includes(query) || 
           phone.includes(query) || 
           church.includes(query);
  });
}, [fathers, searchQuery]);

  const columns: ColumnDef<Father>[] = [
    {
      accessorKey: "fullName",
      header: t("Father Name"),
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <User className="h-5 w-5 text-primary" />
          </div>
          <div>
            <div className="font-semibold">{row.original.fullName}</div>
            <div className="text-sm text-muted-foreground">ID: {row.original.id}</div>
          </div>
        </div>
      ),
    },
    {
      accessorKey: "phoneNumber",
      header: t("Phone"),
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Phone className="h-3 w-3 text-muted-foreground" />
          <span className="text-sm">{row.original.phoneNumber || "-"}</span>
        </div>
      ),
    },
    {
      accessorKey: "churchName",
      header: t("Church"),
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Church className="h-3 w-3 text-muted-foreground" />
          <span className="text-sm">{row.original.churchName || "-"}</span>
        </div>
      ),
    },
    {
      accessorKey: "clericalRank",
      header: t("Rank"),
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Award className="h-3 w-3 text-muted-foreground" />
          <span className="text-sm">{row.original.clericalRankLabel || row.original.clericalRank || "-"}</span>
        </div>
      ),
    },
    {
      accessorKey: "dioceseName",
      header: t("Diocese"),
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Landmark className="h-3 w-3 text-muted-foreground" />
          <span className="text-sm">{row.original.dioceseName || "-"}</span>
        </div>
      ),
    },
    {
      accessorKey: "monasticismType",
      header: t("Type"),
      cell: ({ row }) => (
        <Badge variant="outline">
          {row.original.monasticismType || "SECULAR"}
        </Badge>
      ),
    },
    {
      accessorKey: "active",
      header: t("Status"),
      cell: ({ row }) => (
        <Badge
          className={
            row.original.active
              ? "bg-green-100 text-green-800"
              : "bg-red-100 text-red-800"
          }
        >
          {row.original.active ? "ACTIVE" : "INACTIVE"}
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
            title={t("View Details")}
            onClick={() => {
              setSelectedFather(row.original);
              setIsViewDialogOpen(true);
            }}
          >
            <Eye className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            title={t("Transfer to another church")}
            onClick={() => {
              setSelectedFather(row.original);
              setTransferChurchId("");
              setIsTransferDialogOpen(true);
            }}
          >
            <ArrowRightLeft className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="text-amber-600 hover:text-amber-700 hover:bg-amber-50"
            title={t("Deactivate")}
            onClick={() => {
              setSelectedFather(row.original);
              setIsDeactivateDialogOpen(true);
            }}
          >
            <Power className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="text-red-600 hover:text-red-700 hover:bg-red-50"
            onClick={() => {
              setSelectedFather(row.original);
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
    setFormState({
      firstName: "",
      middleName: "",
      lastName: "",
      phoneNumber: "",
      churchId: "",
      dioceseId: "",
      clericalRank: "PRIEST",
      monasticismType: "SECULAR",
      monasticName: "",
      spiritualInfo: [defaultSpiritualInfo],
      serviceHistory: [defaultServiceHistory],
      educationList: [defaultEducation],
    });
    setActiveTab("basic");
    setIsDialogOpen(true);
  };

  const handleTransfer = async () => {
    if (!selectedFather || !transferChurchId) {
      setAlert({ type: "error", message: "Please select a destination church." });
      return;
    }
    setIsSubmitting(true);
    try {
      await transferFather(selectedFather.id, transferChurchId);
      setAlert({ type: "success", message: "Father transferred successfully!" });
      await applyFilters(rankFilter, monasticismFilter);
      setTimeout(() => setAlert(null), 3000);
    } catch (err: any) {
      setAlert({ type: "error", message: err.message || "Transfer failed" });
    } finally {
      setIsSubmitting(false);
      setIsTransferDialogOpen(false);
    }
  };

  const handleDeactivate = async () => {
    if (!selectedFather) return;
    setIsSubmitting(true);
    try {
      await deactivateFather(selectedFather.id);
      setAlert({ type: "success", message: "Father deactivated successfully!" });
      await applyFilters(rankFilter, monasticismFilter);
      setTimeout(() => setAlert(null), 3000);
    } catch (err: any) {
      setAlert({ type: "error", message: err.message || "Deactivation failed" });
    } finally {
      setIsSubmitting(false);
      setIsDeactivateDialogOpen(false);
    }
  };

  const addSpiritualInfo = () => {
    setFormState({
      ...formState,
      spiritualInfo: [...formState.spiritualInfo, defaultSpiritualInfo],
    });
  };

  const removeSpiritualInfo = (index: number) => {
    setFormState({
      ...formState,
      spiritualInfo: formState.spiritualInfo.filter((_, i) => i !== index),
    });
  };

  const updateSpiritualInfo = (index: number, field: keyof SpiritualInfo, value: any) => {
    const updated = [...formState.spiritualInfo];
    updated[index] = { ...updated[index], [field]: value };
    setFormState({ ...formState, spiritualInfo: updated });
  };

  const addServiceHistory = () => {
    setFormState({
      ...formState,
      serviceHistory: [...formState.serviceHistory, defaultServiceHistory],
    });
  };

  const removeServiceHistory = (index: number) => {
    setFormState({
      ...formState,
      serviceHistory: formState.serviceHistory.filter((_, i) => i !== index),
    });
  };

  const updateServiceHistory = (index: number, field: keyof ServiceHistory, value: string) => {
    const updated = [...formState.serviceHistory];
    updated[index] = { ...updated[index], [field]: value };
    setFormState({ ...formState, serviceHistory: updated });
  };

  const addEducation = () => {
    setFormState({
      ...formState,
      educationList: [...formState.educationList, defaultEducation],
    });
  };

  const removeEducation = (index: number) => {
    setFormState({
      ...formState,
      educationList: formState.educationList.filter((_, i) => i !== index),
    });
  };

  const updateEducation = (index: number, field: keyof Education, value: string) => {
    const updated = [...formState.educationList];
    updated[index] = { ...updated[index], [field]: value };
    setFormState({ ...formState, educationList: updated });
  };

  const handleSubmit = async () => {
    if (!formState.firstName || !formState.lastName || !formState.churchId) {
      setAlert({ type: "error", message: "Please fill all required fields" });
      return;
    }

    setIsSubmitting(true);
    setAlert(null);

    try {
      await createFather(formState);
      setAlert({ type: "success", message: "Father registered successfully!" });
      await loadData();
      setIsDialogOpen(false);
      setTimeout(() => setAlert(null), 3000);
    } catch (err: any) {
      setAlert({ type: "error", message: err.message || "Operation failed" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedFather) return;

    setIsSubmitting(true);
    try {
      await deleteFather(selectedFather.id);
      setAlert({ type: "success", message: "Father deleted successfully!" });
      await loadData();
      setTimeout(() => setAlert(null), 3000);
    } catch (err: any) {
      setAlert({ type: "error", message: err.message || "Delete failed" });
    } finally {
      setIsSubmitting(false);
      setIsDeleteDialogOpen(false);
    }
  };

  const getStatusBadge = (active: boolean) => {
    return active ? (
      <Badge className="bg-green-100 text-green-800 hover:bg-green-200">
        <CheckCircle className="h-3 w-3 mr-1" /> Active
      </Badge>
    ) : (
      <Badge variant="destructive">
        <XCircle className="h-3 w-3 mr-1" /> Inactive
      </Badge>
    );
  };

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold">{t("Fathers")}</h1>
            <p className="text-muted-foreground">{t("Manage spiritual fathers and their information")}</p>
          </div>
          <Button onClick={handleAdd} size="lg">
            <Plus className="h-5 w-5 mr-2" /> {t("Add Father")}
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
              placeholder={t("Search by name, phone, or church...")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={rankFilter} onValueChange={setRankFilter}>
            <SelectTrigger className="w-full sm:w-48">
              <Filter className="h-3.5 w-3.5 mr-1 text-muted-foreground" />
              <SelectValue placeholder={t("Filter by rank")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">{t("All Ranks")}</SelectItem>
              {CLERICAL_RANKS.map((r) => (
                <SelectItem key={r} value={r}>
                  {r}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={monasticismFilter} onValueChange={setMonasticismFilter}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder={t("Filter by type")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">{t("All Types")}</SelectItem>
              {MONASTICISM_TYPES.map((m) => (
                <SelectItem key={m} value={m}>
                  {m}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" size="icon" onClick={() => applyFilters(rankFilter, monasticismFilter)} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <DataTable columns={columns} data={filteredFathers} />
        )}

        {/* View Father Dialog */}
        <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
          <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-2xl">
                <UserCog className="h-6 w-6 text-primary" />
                {t("Father Details")}
              </DialogTitle>
            </DialogHeader>
            
            {selectedFather && (
              <div className="space-y-6">
                {/* Basic Information Card */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Info className="h-5 w-5 text-primary" />
                      {t("Basic Information")}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      <div>
                        <Label className="text-muted-foreground">{t("Full Name")}</Label>
                        <p className="font-semibold text-lg">{selectedFather.fullName}</p>
                      </div>
                      <div>
                        <Label className="text-muted-foreground">{t("ID")}</Label>
                        <p className="font-semibold">{selectedFather.id}</p>
                      </div>
                      <div>
                        <Label className="text-muted-foreground">{t("Phone Number")}</Label>
                        <p className="font-semibold">{selectedFather.phoneNumber || "-"}</p>
                      </div>
                      <div>
                        <Label className="text-muted-foreground">{t("Church")}</Label>
                        <p className="font-semibold flex items-center gap-1">
                          <Church className="h-4 w-4 text-muted-foreground" />
                          {selectedFather.churchName || "-"}
                        </p>
                      </div>
                      <div>
                        <Label className="text-muted-foreground">{t("Diocese")}</Label>
                        <p className="font-semibold flex items-center gap-1">
                          <Landmark className="h-4 w-4 text-muted-foreground" />
                          {selectedFather.dioceseName || "-"}
                        </p>
                      </div>
                      <div>
                        <Label className="text-muted-foreground">{t("Status")}</Label>
                        <div className="mt-1">{getStatusBadge(selectedFather.active)}</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Church & Rank Information */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Award className="h-5 w-5 text-primary" />
                      {t("Church & Rank Information")}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label className="text-muted-foreground">{t("Clerical Rank")}</Label>
                        <p className="font-semibold">
                          {selectedFather.clericalRankLabel || selectedFather.clericalRank || "-"}
                        </p>
                      </div>
                      <div>
                        <Label className="text-muted-foreground">{t("Monasticism Type")}</Label>
                        <p className="font-semibold">{selectedFather.monasticismType || "-"}</p>
                      </div>
                      {selectedFather.monasticName && (
                        <div>
                          <Label className="text-muted-foreground">{t("Monastic Name")}</Label>
                          <p className="font-semibold">{selectedFather.monasticName}</p>
                        </div>
                      )}
                      {selectedFather.ordination && (
                        <div>
                          <Label className="text-muted-foreground">{t("Ordination")}</Label>
                          <p className="font-semibold">{selectedFather.ordination}</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Spiritual Information Card */}
                {selectedFather.spiritualInfo && selectedFather.spiritualInfo.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Briefcase className="h-5 w-5 text-primary" />
                        {t("Spiritual Information")}
                      </CardTitle>
                      <CardDescription>
                        {t("Spiritual journey and ministry details")}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ScrollArea className="max-h-[300px]">
                        <div className="space-y-4">
                          {selectedFather.spiritualInfo.map((info, idx) => (
                            <div key={idx} className="border rounded-lg p-4">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <div>
                                  <Label className="text-muted-foreground">{t("Kinet Place")}</Label>
                                  <p className="font-semibold">{info.kinetPlace || "-"}</p>
                                </div>
                                <div>
                                  <Label className="text-muted-foreground">{t("Kinet Date")}</Label>
                                  <p className="font-semibold">{info.kinetDate ? new Date(info.kinetDate).toLocaleDateString() : "-"}</p>
                                </div>
                                <div>
                                  <Label className="text-muted-foreground">{t("Current Church Start Date")}</Label>
                                  <p className="font-semibold">{info.currentChurchStartDate ? new Date(info.currentChurchStartDate).toLocaleDateString() : "-"}</p>
                                </div>
                                <div>
                                  <Label className="text-muted-foreground">{t("Role")}</Label>
                                  <p className="font-semibold">{info.role || "-"}</p>
                                </div>
                                <div>
                                  <Label className="text-muted-foreground">{t("Start Date")}</Label>
                                  <p className="font-semibold">{info.startDate ? new Date(info.startDate).toLocaleDateString() : "-"}</p>
                                </div>
                                <div>
                                  <Label className="text-muted-foreground">{t("End Date")}</Label>
                                  <p className="font-semibold">{info.endDate ? new Date(info.endDate).toLocaleDateString() : "-"}</p>
                                </div>
                                <div>
                                  <Label className="text-muted-foreground">{t("Number of Children")}</Label>
                                  <p className="font-semibold">{info.numberOfChildren || 0}</p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                    </CardContent>
                  </Card>
                )}

                {/* Service History Card */}
                {selectedFather.serviceHistory && selectedFather.serviceHistory.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Clock className="h-5 w-5 text-primary" />
                        {t("Service History")}
                      </CardTitle>
                      <CardDescription>
                        {t("Historical service records at different churches")}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ScrollArea className="max-h-[250px]">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>{t("Church Name")}</TableHead>
                              <TableHead>{t("Start Date")}</TableHead>
                              <TableHead>{t("End Date")}</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {selectedFather.serviceHistory.map((service, idx) => (
                              <TableRow key={idx}>
                                <TableCell className="font-medium">{service.churchName || "-"}</TableCell>
                                <TableCell>{service.startDate ? new Date(service.startDate).toLocaleDateString() : "-"}</TableCell>
                                <TableCell>{service.endDate ? new Date(service.endDate).toLocaleDateString() : "-"}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </ScrollArea>
                    </CardContent>
                  </Card>
                )}

                {/* Education Card */}
                {selectedFather.educationList && selectedFather.educationList.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <GraduationCap className="h-5 w-5 text-primary" />
                        {t("Education")}
                      </CardTitle>
                      <CardDescription>
                        {t("Educational background and qualifications")}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ScrollArea className="max-h-[250px]">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>{t("Institution")}</TableHead>
                              <TableHead>{t("Field of Study")}</TableHead>
                              <TableHead>{t("Start Date")}</TableHead>
                              <TableHead>{t("End Date")}</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {selectedFather.educationList.map((edu, idx) => (
                              <TableRow key={idx}>
                                <TableCell className="font-medium">{edu.institutionName || "-"}</TableCell>
                                <TableCell>{edu.fieldOfStudy || "-"}</TableCell>
                                <TableCell>{edu.startDate ? new Date(edu.startDate).toLocaleDateString() : "-"}</TableCell>
                                <TableCell>{edu.endDate ? new Date(edu.endDate).toLocaleDateString() : "-"}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </ScrollArea>
                    </CardContent>
                  </Card>
                )}

                {/* Transfer History Card */}
                {selectedFather.transferHistory && selectedFather.transferHistory.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <ArrowRightLeft className="h-5 w-5 text-primary" />
                        {t("Transfer History")}
                      </CardTitle>
                      <CardDescription>
                        {t("Church transfer records")}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ScrollArea className="max-h-[250px]">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>{t("From Church")}</TableHead>
                              <TableHead>{t("To Church")}</TableHead>
                              <TableHead>{t("Transfer Date")}</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {selectedFather.transferHistory.map((transfer, idx) => (
                              <TableRow key={idx}>
                                <TableCell className="font-medium">{transfer.fromChurchName || "-"}</TableCell>
                                <TableCell>{transfer.toChurchName || "-"}</TableCell>
                                <TableCell>
                                  {transfer.transferDate ? new Date(transfer.transferDate).toLocaleString() : "-"}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </ScrollArea>
                    </CardContent>
                  </Card>
                )}

                {/* Quick Actions */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <UserCog className="h-5 w-5 text-primary" />
                      {t("Quick Actions")}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setIsViewDialogOpen(false);
                          setTransferChurchId("");
                          setIsTransferDialogOpen(true);
                        }}
                      >
                        <ArrowRightLeft className="h-4 w-4 mr-2" />
                        {t("Transfer to Church")}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-amber-600 hover:text-amber-700"
                        onClick={() => {
                          setIsViewDialogOpen(false);
                          setIsDeactivateDialogOpen(true);
                        }}
                      >
                        <Power className="h-4 w-4 mr-2" />
                        {t("Deactivate")}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-red-600 hover:text-red-700"
                        onClick={() => {
                          setIsViewDialogOpen(false);
                          setIsDeleteDialogOpen(true);
                        }}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        {t("Delete")}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            <DialogFooter>
              <Button onClick={() => setIsViewDialogOpen(false)}>{t("Close")}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Add Father Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-2xl">{t("Register New Father")}</DialogTitle>
            </DialogHeader>
            
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="basic">Basic Info</TabsTrigger>
                <TabsTrigger value="spiritual">Spiritual Info</TabsTrigger>
                <TabsTrigger value="service">Service History</TabsTrigger>
                <TabsTrigger value="education">Education</TabsTrigger>
              </TabsList>
              
              <TabsContent value="basic" className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>{t("First Name")} *</Label>
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
                  <Label>{t("Last Name")} *</Label>
                  <Input
                    value={formState.lastName}
                    onChange={(e) => setFormState({ ...formState, lastName: e.target.value })}
                  />
                </div>
                <div>
                  <Label>{t("Phone Number")}</Label>
                  <Input
                    type="tel"
                    value={formState.phoneNumber}
                    onChange={(e) => setFormState({ ...formState, phoneNumber: e.target.value })}
                  />
                </div>
                <div>
                  <Label>{t("Church")} *</Label>
                  <Select
                    value={formState.churchId}
                    onValueChange={(v) => setFormState({ ...formState, churchId: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select church" />
                    </SelectTrigger>
                    <SelectContent>
                      {churches.map((church) => (
                        <SelectItem key={church.id} value={church.id}>
                          {church.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>{t("Diocese")}</Label>
                  <Select
                    value={formState.dioceseId}
                    onValueChange={(v) => setFormState({ ...formState, dioceseId: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={t("Select diocese")} />
                    </SelectTrigger>
                    <SelectContent>
                      {dioceses.map((d) => (
                        <SelectItem key={d.id} value={d.id}>
                          {d.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>{t("Clerical Rank")}</Label>
                    <Select
                      value={formState.clericalRank}
                      onValueChange={(v) => setFormState({ ...formState, clericalRank: v })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {CLERICAL_RANKS.map((r) => (
                          <SelectItem key={r} value={r}>
                            {r}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>{t("Monasticism Type")}</Label>
                    <Select
                      value={formState.monasticismType}
                      onValueChange={(v) => setFormState({ ...formState, monasticismType: v })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {MONASTICISM_TYPES.map((m) => (
                          <SelectItem key={m} value={m}>
                            {m}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                {formState.monasticismType === "MONK" && (
                  <div>
                    <Label>{t("Monastic Name")}</Label>
                    <Input
                      value={formState.monasticName}
                      onChange={(e) => setFormState({ ...formState, monasticName: e.target.value })}
                      placeholder={t("e.g. Abba X")}
                    />
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="spiritual" className="space-y-4 py-4">
                {formState.spiritualInfo.map((info, index) => (
                  <div key={index} className="border p-4 rounded-lg space-y-3">
                    <div className="flex justify-between items-center">
                      <Label className="font-semibold">Spiritual Info #{index + 1}</Label>
                      {index > 0 && (
                        <Button variant="ghost" size="sm" onClick={() => removeSpiritualInfo(index)}>
                          Remove
                        </Button>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label>Kinet Place</Label>
                        <Input
                          value={info.kinetPlace}
                          onChange={(e) => updateSpiritualInfo(index, "kinetPlace", e.target.value)}
                        />
                      </div>
                      <div>
                        <Label>Kinet Date</Label>
                        <Input
                          type="date"
                          value={info.kinetDate}
                          onChange={(e) => updateSpiritualInfo(index, "kinetDate", e.target.value)}
                        />
                      </div>
                      <div>
                        <Label>Current Church Start Date</Label>
                        <Input
                          type="date"
                          value={info.currentChurchStartDate}
                          onChange={(e) => updateSpiritualInfo(index, "currentChurchStartDate", e.target.value)}
                        />
                      </div>
                      <div>
                        <Label>Role</Label>
                        <Input
                          value={info.role}
                          onChange={(e) => updateSpiritualInfo(index, "role", e.target.value)}
                        />
                      </div>
                      <div>
                        <Label>Start Date</Label>
                        <Input
                          type="date"
                          value={info.startDate}
                          onChange={(e) => updateSpiritualInfo(index, "startDate", e.target.value)}
                        />
                      </div>
                      <div>
                        <Label>End Date</Label>
                        <Input
                          type="date"
                          value={info.endDate}
                          onChange={(e) => updateSpiritualInfo(index, "endDate", e.target.value)}
                        />
                      </div>
                      <div>
                        <Label>Number of Children</Label>
                        <Input
                          type="number"
                          value={info.numberOfChildren}
                          onChange={(e) => updateSpiritualInfo(index, "numberOfChildren", parseInt(e.target.value))}
                        />
                      </div>
                    </div>
                  </div>
                ))}
                <Button type="button" variant="outline" onClick={addSpiritualInfo} className="w-full">
                  + Add Spiritual Info
                </Button>
              </TabsContent>
              
              <TabsContent value="service" className="space-y-4 py-4">
                {formState.serviceHistory.map((service, index) => (
                  <div key={index} className="border p-4 rounded-lg space-y-3">
                    <div className="flex justify-between items-center">
                      <Label className="font-semibold">Service #{index + 1}</Label>
                      {index > 0 && (
                        <Button variant="ghost" size="sm" onClick={() => removeServiceHistory(index)}>
                          Remove
                        </Button>
                      )}
                    </div>
                    <div>
                      <Label>Church Name</Label>
                      <Input
                        value={service.churchName}
                        onChange={(e) => updateServiceHistory(index, "churchName", e.target.value)}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label>Start Date</Label>
                        <Input
                          type="date"
                          value={service.startDate}
                          onChange={(e) => updateServiceHistory(index, "startDate", e.target.value)}
                        />
                      </div>
                      <div>
                        <Label>End Date</Label>
                        <Input
                          type="date"
                          value={service.endDate}
                          onChange={(e) => updateServiceHistory(index, "endDate", e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                ))}
                <Button type="button" variant="outline" onClick={addServiceHistory} className="w-full">
                  + Add Service History
                </Button>
              </TabsContent>
              
              <TabsContent value="education" className="space-y-4 py-4">
                {formState.educationList.map((edu, index) => (
                  <div key={index} className="border p-4 rounded-lg space-y-3">
                    <div className="flex justify-between items-center">
                      <Label className="font-semibold">Education #{index + 1}</Label>
                      {index > 0 && (
                        <Button variant="ghost" size="sm" onClick={() => removeEducation(index)}>
                          Remove
                        </Button>
                      )}
                    </div>
                    <div>
                      <Label>Institution Name</Label>
                      <Input
                        value={edu.institutionName}
                        onChange={(e) => updateEducation(index, "institutionName", e.target.value)}
                      />
                    </div>
                    <div>
                      <Label>Field of Study</Label>
                      <Input
                        value={edu.fieldOfStudy}
                        onChange={(e) => updateEducation(index, "fieldOfStudy", e.target.value)}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label>Start Date</Label>
                        <Input
                          type="date"
                          value={edu.startDate}
                          onChange={(e) => updateEducation(index, "startDate", e.target.value)}
                        />
                      </div>
                      <div>
                        <Label>End Date</Label>
                        <Input
                          type="date"
                          value={edu.endDate}
                          onChange={(e) => updateEducation(index, "endDate", e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                ))}
                <Button type="button" variant="outline" onClick={addEducation} className="w-full">
                  + Add Education
                </Button>
              </TabsContent>
            </Tabs>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)} disabled={isSubmitting}>
                {t("Cancel")}
              </Button>
              <Button onClick={handleSubmit} disabled={isSubmitting}>
                {isSubmitting ? t("Saving...") : t("Register")}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Transfer Dialog */}
        <Dialog open={isTransferDialogOpen} onOpenChange={setIsTransferDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t("Transfer Father")}</DialogTitle>
            </DialogHeader>
            <p className="text-muted-foreground text-sm">
              {t("Move")} <strong>{selectedFather?.fullName}</strong> {t("to a new church.")}
            </p>
            <div>
              <Label>{t("New Church")} *</Label>
              <Select value={transferChurchId} onValueChange={setTransferChurchId}>
                <SelectTrigger>
                  <SelectValue placeholder={t("Select destination church")} />
                </SelectTrigger>
                <SelectContent>
                  {churches.map((church) => (
                    <SelectItem key={church.id} value={church.id}>
                      {church.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsTransferDialogOpen(false)}>
                {t("Cancel")}
              </Button>
              <Button onClick={handleTransfer} disabled={isSubmitting}>
                {isSubmitting ? t("Transferring...") : t("Transfer")}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Deactivate Dialog */}
        <Dialog open={isDeactivateDialogOpen} onOpenChange={setIsDeactivateDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t("Deactivate Father?")}</DialogTitle>
            </DialogHeader>
            <p className="text-muted-foreground">
              {t("Are you sure you want to deactivate")} <strong>{selectedFather?.fullName}</strong>?
            </p>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDeactivateDialogOpen(false)}>
                {t("Cancel")}
              </Button>
              <Button variant="destructive" onClick={handleDeactivate} disabled={isSubmitting}>
                {isSubmitting ? t("Deactivating...") : t("Deactivate")}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t("Delete Father?")}</DialogTitle>
            </DialogHeader>
            <p className="text-muted-foreground">
              {t("Are you sure you want to delete")} <strong>{selectedFather?.fullName}</strong>?
              {t("This action cannot be undone.")}
            </p>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
                {t("Cancel")}
              </Button>
              <Button variant="destructive" onClick={handleDelete} disabled={isSubmitting}>
                {isSubmitting ? t("Deleting...") : t("Delete")}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
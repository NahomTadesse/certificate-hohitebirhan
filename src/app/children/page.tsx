

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
//   User,
//   UserRound,
//   GitBranch,
//   History,
//   Banknote,
//   FileText,
//   Eye,
//   Info,
//   Users2,
//   UserCheck,
//   UserX,
//   CalendarDays,
//   Hash,
//   QrCode,
//   Link2,
//   Shield,
//   IdCard,
//   Upload,
//   Printer,
//   Download,
// } from "lucide-react";
// import { useRef } from "react";
// import { useReactToPrint } from "react-to-print";

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
// import {
//   Card,
//   CardContent,
//   CardDescription,
//   CardHeader,
//   CardTitle,
// } from "@/components/ui/card";
// import {
//   Table,
//   TableBody,
//   TableCell,
//   TableHead,
//   TableHeader,
//   TableRow,
// } from "@/components/ui/table";
// import { ScrollArea } from "@/components/ui/scroll-area";

// import DashboardLayout from "../dashboard/layout";
// import {
//   fetchChildren,
//   createChild,
//   changeFather,
//   deleteChild,
//   Child,
// } from "@/services/childrenService";
// import { fetchFathersForDropdown, Father } from "@/services/fatherService";
// import { fetchFatherTransfersByChild } from "@/services/fatherTransferService";
// import { useRouter } from "next/navigation";
// import { useTranslation } from "react-i18next";

// export default function ChildrenManagement() {
//   const [children, setChildren] = useState<Child[]>([]);
//   const [fathers, setFathers] = useState<Father[]>([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState<string | null>(null);
//   const [alert, setAlert] = useState<{ type: "success" | "error"; message: string } | null>(null);
//   const router = useRouter();
//   const [searchQuery, setSearchQuery] = useState("");
//   const [isDialogOpen, setIsDialogOpen] = useState(false);
//   const [isChangeFatherDialogOpen, setIsChangeFatherDialogOpen] = useState(false);
//   const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
//   const [isHistoryDialogOpen, setIsHistoryDialogOpen] = useState(false);
//   const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
//   const [transferHistory, setTransferHistory] = useState<any[]>([]);
//   const [historyLoading, setHistoryLoading] = useState(false);
//   const [selectedChild, setSelectedChild] = useState<Child | null>(null);
//   const [isSubmitting, setIsSubmitting] = useState(false);
//   const [isIdCardDialogOpen, setIsIdCardDialogOpen] = useState(false);
//   const [idCardChild, setIdCardChild] = useState<Child | null>(null);
//   const [idCardPhoto, setIdCardPhoto] = useState<string | null>(null);
//   const idCardRef = useRef<HTMLDivElement>(null);
//   const { t } = useTranslation();

//   const handlePrintIdCard = useReactToPrint({
//     contentRef: idCardRef,
//     documentTitle: idCardChild
//       ? `ID-${idCardChild.sebekaMemberId || idCardChild.id}`
//       : "ID-Card",
//   });

//   const handleGenerateId = (child: Child) => {
//     setIdCardChild(child);
//     setIdCardPhoto(null);
//     setIsIdCardDialogOpen(true);
//   };

//   const handleIdPhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
//     const file = e.target.files?.[0];
//     if (!file) return;
//     const reader = new FileReader();
//     reader.onload = () => setIdCardPhoto(reader.result as string);
//     reader.readAsDataURL(file);
//   };

//   const getIdCardQrUrl = (child: Child) => {
//     const qrData = JSON.stringify({
//       id: child.id,
//       sebekaId: (child as any).sebekaMemberId || child.id,
//       name: `${child.firstName} ${child.middleName || ""} ${child.lastName}`.trim(),
//       dob: child.dateOfBirth,
//       church: (child as any).churchName || "",
//     });
//     return `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(qrData)}`;
//   };

//   const handleViewHistory = async (child: Child) => {
//     setSelectedChild(child);
//     setIsHistoryDialogOpen(true);
//     setHistoryLoading(true);
//     try {
//       const response = await fetchFatherTransfersByChild(child.id);
//       const data = (response as any)?.data;
//       setTransferHistory(Array.isArray(data) ? data : []);
//     } catch (err) {
//       setTransferHistory([]);
//     } finally {
//       setHistoryLoading(false);
//     }
//   };

//   const handleViewDetails = (child: Child) => {
//     setSelectedChild(child);
//     setIsViewDialogOpen(true);
//   };

//   const [formState, setFormState] = useState({
//     firstName: "",
//     middleName: "",
//     lastName: "",
//     phoneNumber: "",
//     dateOfBirth: "",
//     gender: "",
//     fatherId: "",
//   });

//   const [changeFatherState, setChangeFatherState] = useState({
//     newFatherId: "",
//     reason: "",
//   });

//   const loadData = useCallback(async () => {
//     setLoading(true);
//     setError(null);
//     try {
//       const [childrenData, fathersData] = await Promise.all([
//         fetchChildren(),
//         fetchFathersForDropdown(),
//       ]);
      
//       console.log('Children Data:', childrenData);
//       console.log('Fathers Data:', fathersData);
      
//       // Handle paginated response for children
//       let childrenArray = [];
//       if (childrenData) {
//         if (Array.isArray(childrenData)) {
//           childrenArray = childrenData;
//         } else if (childrenData.content && Array.isArray(childrenData.content)) {
//           childrenArray = childrenData.content;
//         } else if (typeof childrenData === 'object' && childrenData !== null) {
//           // Try to find any array property
//           const possibleArrays = Object.values(childrenData).filter(val => Array.isArray(val));
//           if (possibleArrays.length > 0) {
//             childrenArray = possibleArrays[0];
//           }
//         }
//       }
      
//       // Handle paginated response for fathers
//       let fathersArray = [];
//       if (fathersData) {
//         if (Array.isArray(fathersData)) {
//           fathersArray = fathersData;
//         } else if (fathersData.content && Array.isArray(fathersData.content)) {
//           fathersArray = fathersData.content;
//         } else if (typeof fathersData === 'object' && fathersData !== null) {
//           // Try to find any array property
//           const possibleArrays = Object.values(fathersData).filter(val => Array.isArray(val));
//           if (possibleArrays.length > 0) {
//             fathersArray = possibleArrays[0];
//           }
//         }
//       }
      
//       console.log('Processed Children:', childrenArray);
//       console.log('Processed Fathers:', fathersArray);
      
//       setChildren(childrenArray);
//       setFathers(fathersArray);
//     } catch (err: any) {
//       console.error('Error loading data:', err);
//       setError("Failed to load data. " + err.message);
//       setChildren([]);
//       setFathers([]);
//     } finally {
//       setLoading(false);
//     }
//   }, []);

//   useEffect(() => {
//     loadData();
//   }, [loadData]);

//   const filteredChildren = useMemo(() => {
//     if (!Array.isArray(children)) {
//       return [];
//     }
    
//     const query = searchQuery.toLowerCase().trim();
//     if (!query) {
//       return children;
//     }
    
//     return children.filter((child) => {
//       const fullName = `${child.firstName} ${child.middleName || ''} ${child.lastName}`.toLowerCase();
//       const phone = child.phoneNumber?.toLowerCase() || '';
//       const sebekaId = child.sebekaMemberId?.toLowerCase() || '';
      
//       return fullName.includes(query) || phone.includes(query) || sebekaId.includes(query);
//     });
//   }, [children, searchQuery]);

//   const getFamilyStatusBadge = (status: string) => {
//     const statusMap: Record<string, { variant: "default" | "secondary" | "destructive" | "outline"; label: string }> = {
//       "FAMILY_HEAD": { variant: "default", label: "Family Head" },
//       "FAMILY_MEMBER": { variant: "secondary", label: "Family Member" },
//       "NO_FAMILY": { variant: "outline", label: "No Family" },
//     };
//     const config = statusMap[status] || { variant: "outline", label: status };
//     return <Badge variant={config.variant}>{config.label}</Badge>;
//   };

//   const getActiveBadge = (active: boolean) => {
//     return active ? (
//       <Badge variant="default" className="bg-green-500 hover:bg-green-600">
//         <CheckCircle className="h-3 w-3 mr-1" /> Active
//       </Badge>
//     ) : (
//       <Badge variant="destructive">
//         <XCircle className="h-3 w-3 mr-1" /> Inactive
//       </Badge>
//     );
//   };

//   const columns: ColumnDef<Child>[] = [
//     {
//       accessorKey: "fullName",
//       header: t("Child Name"),
//       cell: ({ row }) => (
//         <div className="flex items-center gap-3">
//           <div className="p-2 bg-primary/10 rounded-lg">
//             <UserRound className="h-5 w-5 text-primary" />
//           </div>
//           <div>
//             <div className="font-semibold">
//               {row.original.fullName}
//             </div>
//             {row.original.sebekaMemberId && (
//               <div className="text-xs text-muted-foreground">
//                 {row.original.sebekaMemberId}
//               </div>
//             )}
//           </div>
//         </div>
//       ),
//     },
//     {
//       accessorKey: "gender",
//       header: t("Gender"),
//       cell: ({ row }) => (
//         <Badge variant="outline">
//           {row.original.gender === "MALE" ? "Male" : row.original.gender === "FEMALE" ? "Female" : row.original.gender}
//         </Badge>
//       ),
//     },
//     {
//       accessorKey: "dateOfBirth",
//       header: t("Date of Birth"),
//       cell: ({ row }) => (
//         <div className="flex items-center gap-2">
//           <Calendar className="h-3 w-3 text-muted-foreground" />
//           <span className="text-sm">
//             {row.original.dateOfBirth ? new Date(row.original.dateOfBirth).toLocaleDateString() : '-'}
//           </span>
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
//       accessorKey: "fatherName",
//       header: t("Father"),
//       cell: ({ row }) => (
//         <div className="flex items-center gap-2">
//           <User className="h-3 w-3 text-muted-foreground" />
//           <span className="text-sm">
//             {row.original.fatherName || (row.original.fatherId ? `Father ID: ${row.original.fatherId}` : 'No Father')}
//           </span>
//         </div>
//       ),
//     },
//     {
//       accessorKey: "familyStatus",
//       header: t("Family Status"),
//       cell: ({ row }) => getFamilyStatusBadge(row.original.familyStatus || "NO_FAMILY"),
//     },
//     {
//       accessorKey: "active",
//       header: t("Status"),
//       cell: ({ row }) => getActiveBadge(row.original.active || false),
//     },
//     {
//       id: "actions",
//       cell: ({ row }) => (
//         <div className="flex gap-2">
//           <Button
//             size="sm"
//             variant="ghost"
//             title={t("View Details")}
//             onClick={() => handleViewDetails(row.original)}
//           >
//             <Eye className="h-4 w-4" />
//           </Button>
//           <Button
//             size="sm"
//             variant="ghost"
//             title={t("Change Father")}
//             onClick={() => {
//               setSelectedChild(row.original);
//               setChangeFatherState({ newFatherId: "", reason: "" });
//               setIsChangeFatherDialogOpen(true);
//             }}
//           >
//             <GitBranch className="h-4 w-4" />
//           </Button>
//           <Button
//             size="sm"
//             variant="ghost"
//             title={t("Transfer History")}
//             onClick={() => handleViewHistory(row.original)}
//           >
//             <History className="h-4 w-4" />
//           </Button>
//           <Button
//             size="sm"
//             variant="ghost"
//             title={t("Record Payment")}
//             onClick={() => router.push(`/payments?childId=${row.original.id}`)}
//           >
//             <Banknote className="h-4 w-4" />
//           </Button>
//           <Button
//             size="sm"
//             variant="ghost"
//             title={t("Generate Certificate")}
//             onClick={() => router.push(`/certificates?childId=${row.original.id}`)}
//           >
//             <FileText className="h-4 w-4" />
//           </Button>
//           <Button
//             size="sm"
//             variant="ghost"
//             title={t("Generate ID Card")}
//             onClick={() => handleGenerateId(row.original)}
//           >
//             <IdCard className="h-4 w-4" />
//           </Button>
//           <Button
//             size="sm"
//             variant="ghost"
//             className="text-red-600 hover:text-red-700 hover:bg-red-50"
//             onClick={() => {
//               setSelectedChild(row.original);
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
//       dateOfBirth: "",
//       gender: "",
//       fatherId: "",
//     });
//     setIsDialogOpen(true);
//   };

//   const handleSubmit = async () => {
//     if (!formState.firstName || !formState.lastName || !formState.dateOfBirth || !formState.gender || !formState.fatherId) {
//       setAlert({ type: "error", message: "Please fill all required fields" });
//       return;
//     }

//     setIsSubmitting(true);
//     setAlert(null);

//     try {
//       await createChild(formState);
//       setAlert({ type: "success", message: "Child registered successfully!" });
//       await loadData();
//       setIsDialogOpen(false);
//       setTimeout(() => setAlert(null), 3000);
//     } catch (err: any) {
//       setAlert({ type: "error", message: err.message || "Operation failed" });
//     } finally {
//       setIsSubmitting(false);
//     }
//   };

//   const handleChangeFather = async () => {
//     if (!selectedChild || !changeFatherState.newFatherId || !changeFatherState.reason) {
//       setAlert({ type: "error", message: "Please select a new father and provide a reason" });
//       return;
//     }

//     setIsSubmitting(true);
//     setAlert(null);

//     try {
//       await changeFather(selectedChild.id, changeFatherState.newFatherId, changeFatherState.reason);
//       setAlert({ type: "success", message: "Father changed successfully!" });
//       await loadData();
//       setIsChangeFatherDialogOpen(false);
//       setTimeout(() => setAlert(null), 3000);
//     } catch (err: any) {
//       setAlert({ type: "error", message: err.message || "Operation failed" });
//     } finally {
//       setIsSubmitting(false);
//     }
//   };

//   const handleDelete = async () => {
//     if (!selectedChild) return;

//     setIsSubmitting(true);
//     try {
//       await deleteChild(selectedChild.id);
//       setAlert({ type: "success", message: "Child deleted successfully!" });
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
//             <h1 className="text-3xl font-bold">{t("Children")}</h1>
//             <p className="text-muted-foreground">{t("Manage children and their father assignments")}</p>
//           </div>
//           <Button onClick={handleAdd} size="lg">
//             <Plus className="h-5 w-5 mr-2" /> {t("Register Child")}
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
//               placeholder={t("Search by name, phone or Sebeka ID...")}
//               value={searchQuery}
//               onChange={(e) => setSearchQuery(e.target.value)}
//               className="pl-10"
//             />
//           </div>
//           <Button variant="outline" size="icon" onClick={loadData} disabled={loading}>
//             <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
//           </Button>
//         </div>

//         {loading ? (
//           <div className="flex justify-center items-center h-64">
//             <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
//           </div>
//         ) : (
//           <DataTable columns={columns} data={filteredChildren} />
//         )}

//         {/* View Details Dialog */}
//         <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
//           <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
//             <DialogHeader>
//               <DialogTitle className="flex items-center gap-2 text-2xl">
//                 <UserRound className="h-6 w-6 text-primary" />
//                 {t("Child Details")}
//               </DialogTitle>
//             </DialogHeader>
            
//             {selectedChild && (
//               <div className="space-y-6">
//                 {/* Basic Information Card */}
//                 <Card>
//                   <CardHeader>
//                     <CardTitle className="flex items-center gap-2">
//                       <Info className="h-5 w-5 text-primary" />
//                       {t("Basic Information")}
//                     </CardTitle>
//                   </CardHeader>
//                   <CardContent>
//                     <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
//                       <div>
//                         <Label className="text-muted-foreground">{t("Full Name")}</Label>
//                         <p className="font-semibold">{selectedChild.fullName}</p>
//                       </div>
//                       <div>
//                         <Label className="text-muted-foreground">{t("Sebeka Member ID")}</Label>
//                         <p className="font-semibold">{selectedChild.sebekaMemberId || "-"}</p>
//                       </div>
//                       <div>
//                         <Label className="text-muted-foreground">{t("Gender")}</Label>
//                         <p className="font-semibold">{selectedChild.gender || "-"}</p>
//                       </div>
//                       <div>
//                         <Label className="text-muted-foreground">{t("Date of Birth")}</Label>
//                         <p className="font-semibold">
//                           {selectedChild.dateOfBirth ? new Date(selectedChild.dateOfBirth).toLocaleDateString() : "-"}
//                         </p>
//                       </div>
//                       <div>
//                         <Label className="text-muted-foreground">{t("Phone Number")}</Label>
//                         <p className="font-semibold">{selectedChild.phoneNumber || "-"}</p>
//                       </div>
//                       <div>
//                         <Label className="text-muted-foreground">{t("Father Name")}</Label>
//                         <p className="font-semibold">{selectedChild.fatherName || "-"}</p>
//                       </div>
//                       <div>
//                         <Label className="text-muted-foreground">{t("Family Status")}</Label>
//                         <div className="mt-1">{getFamilyStatusBadge(selectedChild.familyStatus || "NO_FAMILY")}</div>
//                       </div>
//                       <div>
//                         <Label className="text-muted-foreground">{t("Status")}</Label>
//                         <div className="mt-1">{getActiveBadge(selectedChild.active || false)}</div>
//                       </div>
//                     </div>
//                   </CardContent>
//                 </Card>

//                 {/* QR Code Card */}
//                 {selectedChild.qrCode && (
//                   <Card>
//                     <CardHeader>
//                       <CardTitle className="flex items-center gap-2">
//                         <QrCode className="h-5 w-5 text-primary" />
//                         {t("QR Code")}
//                       </CardTitle>
//                     </CardHeader>
//                     <CardContent>
//                       <div className="flex items-center gap-6">
//                         <img 
//                           src={selectedChild.qrCode} 
//                           alt="QR Code" 
//                           className="w-32 h-32 border rounded-lg"
//                         />
//                         {selectedChild.qrLink && (
//                           <div>
//                             <Label className="text-muted-foreground">{t("QR Link")}</Label>
//                             <p className="text-sm text-blue-600 break-all">{selectedChild.qrLink}</p>
//                           </div>
//                         )}
//                       </div>
//                     </CardContent>
//                   </Card>
//                 )}

//                 {/* Family Information Card */}
//                 {selectedChild.family ? (
//                   <Card>
//                     <CardHeader>
//                       <CardTitle className="flex items-center gap-2">
//                         <Users2 className="h-5 w-5 text-primary" />
//                         {t("Family Information")}
//                       </CardTitle>
//                       <CardDescription>
//                         {t("Family Head:")} {selectedChild.family.fullName || selectedChild.family.familyHeadId}
//                       </CardDescription>
//                     </CardHeader>
//                     <CardContent>
//                       <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
//                         <div>
//                           <Label className="text-muted-foreground">{t("Family Head ID")}</Label>
//                           <p className="font-semibold">{selectedChild.family.familyHeadId}</p>
//                         </div>
//                         <div>
//                           <Label className="text-muted-foreground">{t("Family Sebeka ID")}</Label>
//                           <p className="font-semibold">{selectedChild.family.sebekaMemberId}</p>
//                         </div>
//                       </div>

//                       {selectedChild.family.members && selectedChild.family.members.length > 0 && (
//                         <div className="mt-4">
//                           <Label className="text-muted-foreground mb-2 block">{t("Family Members")}</Label>
//                           <ScrollArea className="h-[200px] rounded-md border">
//                             <Table>
//                               <TableHeader>
//                                 <TableRow>
//                                   <TableHead>{t("Name")}</TableHead>
//                                   <TableHead>{t("Relation")}</TableHead>
//                                   <TableHead>{t("Existing Child ID")}</TableHead>
//                                 </TableRow>
//                               </TableHeader>
//                               <TableBody>
//                                 {selectedChild.family.members.map((member, index) => (
//                                   <TableRow key={index}>
//                                     <TableCell className="font-medium">{member.fullName}</TableCell>
//                                     <TableCell>
//                                       <Badge variant="outline">{member.relationType}</Badge>
//                                     </TableCell>
//                                     <TableCell>{member.existingChildId || "-"}</TableCell>
//                                   </TableRow>
//                                 ))}
//                               </TableBody>
//                             </Table>
//                           </ScrollArea>
//                         </div>
//                       )}
//                     </CardContent>
//                   </Card>
//                 ) : (
//                   <Card>
//                     <CardContent className="py-8">
//                       <div className="text-center text-muted-foreground">
//                         <UserX className="h-12 w-12 mx-auto mb-2 opacity-50" />
//                         <p>{t("No family information available")}</p>
//                       </div>
//                     </CardContent>
//                   </Card>
//                 )}

//                 {/* Quick Actions */}
//                 <Card>
//                   <CardHeader>
//                     <CardTitle className="flex items-center gap-2">
//                       <Shield className="h-5 w-5 text-primary" />
//                       {t("Quick Actions")}
//                     </CardTitle>
//                   </CardHeader>
//                   <CardContent>
//                     <div className="flex flex-wrap gap-2">
//                       <Button
//                         variant="outline"
//                         size="sm"
//                         onClick={() => {
//                           setIsViewDialogOpen(false);
//                           setSelectedChild(selectedChild);
//                           setChangeFatherState({ newFatherId: "", reason: "" });
//                           setIsChangeFatherDialogOpen(true);
//                         }}
//                       >
//                         <GitBranch className="h-4 w-4 mr-2" />
//                         {t("Change Father")}
//                       </Button>
//                       <Button
//                         variant="outline"
//                         size="sm"
//                         onClick={() => {
//                           setIsViewDialogOpen(false);
//                           handleViewHistory(selectedChild);
//                         }}
//                       >
//                         <History className="h-4 w-4 mr-2" />
//                         {t("Transfer History")}
//                       </Button>
//                       <Button
//                         variant="outline"
//                         size="sm"
//                         onClick={() => {
//                           setIsViewDialogOpen(false);
//                           router.push(`/payments?childId=${selectedChild.id}`);
//                         }}
//                       >
//                         <Banknote className="h-4 w-4 mr-2" />
//                         {t("Record Payment")}
//                       </Button>
//                       <Button
//                         variant="outline"
//                         size="sm"
//                         onClick={() => {
//                           setIsViewDialogOpen(false);
//                           router.push(`/certificates?childId=${selectedChild.id}`);
//                         }}
//                       >
//                         <FileText className="h-4 w-4 mr-2" />
//                         {t("Generate Certificate")}
//                       </Button>
//                     </div>
//                   </CardContent>
//                 </Card>
//               </div>
//             )}

//             <DialogFooter>
//               <Button onClick={() => setIsViewDialogOpen(false)}>{t("Close")}</Button>
//             </DialogFooter>
//           </DialogContent>
//         </Dialog>

//         {/* Add Child Dialog */}
//         <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
//           <DialogContent className="sm:max-w-lg">
//             <DialogHeader>
//               <DialogTitle className="text-2xl">{t("Register New Child")}</DialogTitle>
//             </DialogHeader>
//             <div className="space-y-4 py-4">
//               <div className="grid grid-cols-2 gap-4">
//                 <div>
//                   <Label>{t("First Name")} *</Label>
//                   <Input
//                     value={formState.firstName}
//                     onChange={(e) => setFormState({ ...formState, firstName: e.target.value })}
//                     placeholder="First name"
//                   />
//                 </div>
//                 <div>
//                   <Label>{t("Middle Name")}</Label>
//                   <Input
//                     value={formState.middleName}
//                     onChange={(e) => setFormState({ ...formState, middleName: e.target.value })}
//                     placeholder="Middle name"
//                   />
//                 </div>
//               </div>
//               <div>
//                 <Label>{t("Last Name")} *</Label>
//                 <Input
//                   value={formState.lastName}
//                   onChange={(e) => setFormState({ ...formState, lastName: e.target.value })}
//                   placeholder="Last name"
//                 />
//               </div>
//               <div>
//                 <Label>{t("Phone Number")}</Label>
//                 <Input
//                   type="tel"
//                   value={formState.phoneNumber}
//                   onChange={(e) => setFormState({ ...formState, phoneNumber: e.target.value })}
//                   placeholder="Phone number"
//                 />
//               </div>
//               <div>
//                 <Label>{t("Date of Birth")} *</Label>
//                 <Input
//                   type="date"
//                   value={formState.dateOfBirth}
//                   onChange={(e) => setFormState({ ...formState, dateOfBirth: e.target.value })}
//                 />
//               </div>
//               <div>
//                 <Label>{t("Gender")} *</Label>
//                 <Select
//                   value={formState.gender}
//                   onValueChange={(v) => setFormState({ ...formState, gender: v })}
//                 >
//                   <SelectTrigger>
//                     <SelectValue placeholder="Select gender" />
//                   </SelectTrigger>
//                   <SelectContent>
//                     <SelectItem value="MALE">Male</SelectItem>
//                     <SelectItem value="FEMALE">Female</SelectItem>
//                   </SelectContent>
//                 </Select>
//               </div>
//               <div>
//                 <Label>{t("Father")} *</Label>
//                 <Select
//                   value={formState.fatherId}
//                   onValueChange={(v) => setFormState({ ...formState, fatherId: v })}
//                 >
//                   <SelectTrigger>
//                     <SelectValue placeholder="Select father" />
//                   </SelectTrigger>
//                   <SelectContent>
//                     {fathers && fathers.length > 0 ? (
//                       fathers.map((father) => (
//                         <SelectItem key={father.id} value={father.id}>
//                           {father.firstName} {father.middleName || ''} {father.lastName}
//                           {father.churchName ? ` - ${father.churchName}` : ''}
//                         </SelectItem>
//                       ))
//                     ) : (
//                       <SelectItem value="no-fathers" disabled className="text-muted-foreground">
//                         No fathers available
//                       </SelectItem>
//                     )}
//                   </SelectContent>
//                 </Select>
//               </div>
//             </div>
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

//         {/* Change Father Dialog */}
//         <Dialog open={isChangeFatherDialogOpen} onOpenChange={setIsChangeFatherDialogOpen}>
//           <DialogContent className="sm:max-w-lg">
//             <DialogHeader>
//               <DialogTitle>{t("Change Father")}</DialogTitle>
//             </DialogHeader>
//             <div className="space-y-4 py-4">
//               <div>
//                 <Label>{t("Current Child")}</Label>
//                 <Input
//                   value={selectedChild ? `${selectedChild.firstName} ${selectedChild.lastName}` : ""}
//                   disabled
//                 />
//               </div>
//               <div>
//                 <Label>{t("New Father")} *</Label>
//                 <Select
//                   value={changeFatherState.newFatherId}
//                   onValueChange={(v) => setChangeFatherState({ ...changeFatherState, newFatherId: v })}
//                 >
//                   <SelectTrigger>
//                     <SelectValue placeholder="Select new father" />
//                   </SelectTrigger>
//                   <SelectContent>
//                     {fathers && fathers.length > 0 ? (
//                       fathers.map((father) => (
//                         <SelectItem key={father.id} value={father.id}>
//                           {father.firstName} {father.middleName || ''} {father.lastName}
//                           {father.churchName ? ` - ${father.churchName}` : ''}
//                         </SelectItem>
//                       ))
//                     ) : (
//                       <SelectItem value="no-fathers" disabled className="text-muted-foreground">
//                         No fathers available
//                       </SelectItem>
//                     )}
//                   </SelectContent>
//                 </Select>
//               </div>
//               <div>
//                 <Label>{t("Reason")} *</Label>
//                 <Input
//                   value={changeFatherState.reason}
//                   onChange={(e) => setChangeFatherState({ ...changeFatherState, reason: e.target.value })}
//                   placeholder="Reason for changing father"
//                 />
//               </div>
//             </div>
//             <DialogFooter>
//               <Button variant="outline" onClick={() => setIsChangeFatherDialogOpen(false)} disabled={isSubmitting}>
//                 {t("Cancel")}
//               </Button>
//               <Button onClick={handleChangeFather} disabled={isSubmitting}>
//                 {isSubmitting ? t("Changing...") : t("Change Father")}
//               </Button>
//             </DialogFooter>
//           </DialogContent>
//         </Dialog>

//         {/* Transfer History Dialog */}
//         <Dialog open={isHistoryDialogOpen} onOpenChange={setIsHistoryDialogOpen}>
//           <DialogContent className="sm:max-w-lg max-h-[80vh] overflow-y-auto">
//             <DialogHeader>
//               <DialogTitle className="flex items-center gap-2">
//                 <History className="h-5 w-5 text-primary" /> {t("Father Transfer History")}
//               </DialogTitle>
//             </DialogHeader>
//             <p className="text-sm text-muted-foreground">
//               {t("For")} <strong>{selectedChild?.fullName || selectedChild?.firstName}</strong>
//             </p>
//             {historyLoading ? (
//               <div className="flex justify-center py-8">
//                 <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
//               </div>
//             ) : transferHistory.length === 0 ? (
//               <div className="text-center text-muted-foreground py-8 text-sm">
//                 {t("No transfer history recorded for this child.")}
//               </div>
//             ) : (
//               <div className="space-y-3">
//                 {transferHistory.map((tr: any, idx: number) => (
//                   <div key={tr.id || idx} className="bg-muted p-3 rounded-lg text-sm space-y-1">
//                     <p><strong>{t("Reason")}:</strong> {tr.reason || "-"}</p>
//                     <p><strong>{t("New Father ID")}:</strong> {tr.newFatherId || "-"}</p>
//                     {tr.transferDate && (
//                       <p><strong>{t("Date")}:</strong> {new Date(tr.transferDate).toLocaleString()}</p>
//                     )}
//                   </div>
//                 ))}
//               </div>
//             )}
//             <DialogFooter>
//               <Button onClick={() => setIsHistoryDialogOpen(false)}>{t("Close")}</Button>
//             </DialogFooter>
//           </DialogContent>
//         </Dialog>

//         {/* Delete Confirmation Dialog */}
//         <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
//           <DialogContent>
//             <DialogHeader>
//               <DialogTitle>{t("Delete Child?")}</DialogTitle>
//             </DialogHeader>
//             <p className="text-muted-foreground">
//               {t("Are you sure you want to delete")} <strong>{selectedChild?.firstName} {selectedChild?.lastName}</strong>?
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

//         {/* Generate ID Card Dialog */}
//         <Dialog open={isIdCardDialogOpen} onOpenChange={setIsIdCardDialogOpen}>
//           <DialogContent className="sm:max-w-md">
//             <DialogHeader>
//               <DialogTitle className="flex items-center gap-2">
//                 <IdCard className="h-5 w-5 text-primary" /> {t("Generate ID Card")}
//               </DialogTitle>
//             </DialogHeader>

//             {idCardChild && (
//               <div className="space-y-4">
//                 <div>
//                   <Label>{t("Member Photo")}</Label>
//                   <div className="flex items-center gap-3 mt-1">
//                     {idCardPhoto && (
//                       <img
//                         src={idCardPhoto}
//                         alt="preview"
//                         className="h-16 w-16 rounded-full object-cover border"
//                       />
//                     )}
//                     <label className="flex items-center gap-2 cursor-pointer text-sm text-primary border border-dashed rounded-md px-3 py-2 hover:bg-muted">
//                       <Upload className="h-4 w-4" />
//                       {idCardPhoto ? t("Change Photo") : t("Upload Photo")}
//                       <input
//                         type="file"
//                         accept="image/*"
//                         className="hidden"
//                         onChange={handleIdPhotoUpload}
//                       />
//                     </label>
//                   </div>
//                 </div>

//                 {/* Printable ID Card */}
//                 <div className="flex justify-center bg-muted/40 p-4 rounded-lg">
//                   <div
//                     ref={idCardRef}
//                     className="w-[260px] bg-white rounded-xl overflow-hidden border shadow-md"
//                   >
//                     <div className="bg-blue-800 text-white text-center py-2 px-2">
//                       <p className="text-[10px] font-semibold leading-tight">
//                         {t("Ethiopian Orthodox Tewahido Church")}
//                       </p>
//                       <p className="text-[9px] opacity-90">
//                         {(idCardChild as any).churchName || t("Church Membership ID")}
//                       </p>
//                     </div>
//                     <div className="flex flex-col items-center py-3">
//                       {idCardPhoto ? (
//                         <img
//                           src={idCardPhoto}
//                           alt="member"
//                           className="h-24 w-24 rounded-md object-cover border-2 border-blue-800"
//                         />
//                       ) : (
//                         <div className="h-24 w-24 rounded-md border-2 border-dashed border-blue-800 flex items-center justify-center text-[10px] text-muted-foreground text-center px-2">
//                           {t("No photo uploaded")}
//                         </div>
//                       )}
//                       <p className="mt-2 font-bold text-sm text-center px-2">
//                         {`${idCardChild.firstName} ${idCardChild.middleName || ""} ${idCardChild.lastName}`.trim()}
//                       </p>
//                       <Badge className="mt-1 bg-blue-100 text-blue-800">
//                         {t("Member")}
//                       </Badge>
//                       <img
//                         src={getIdCardQrUrl(idCardChild)}
//                         alt="QR code"
//                         className="h-24 w-24 mt-3"
//                       />
//                       <p className="mt-2 text-xs font-semibold">
//                         ID: {(idCardChild as any).sebekaMemberId || idCardChild.id}
//                       </p>
//                     </div>
//                   </div>
//                 </div>
//               </div>
//             )}

//             <DialogFooter className="gap-2">
//               <Button variant="outline" onClick={() => setIsIdCardDialogOpen(false)}>
//                 {t("Close")}
//               </Button>
//               <Button variant="outline" onClick={() => handlePrintIdCard?.()}>
//                 <Download className="h-4 w-4 mr-2" /> {t("Download")}
//               </Button>
//               <Button onClick={() => handlePrintIdCard?.()}>
//                 <Printer className="h-4 w-4 mr-2" /> {t("Print")}
//               </Button>
//             </DialogFooter>
//           </DialogContent>
//         </Dialog>
//       </div>
//     </DashboardLayout>
//   );
// }

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
//   User,
//   UserRound,
//   GitBranch,
//   History,
//   Banknote,
//   FileText,
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

// import DashboardLayout from "../dashboard/layout";
// import {
//   fetchChildren,
//   createChild,
//   changeFather,
//   deleteChild,
//   Child,
// } from "@/services/childrenService";
// import { fetchFathersForDropdown, Father } from "@/services/fatherService";
// import { fetchFatherTransfersByChild } from "@/services/fatherTransferService";
// import { useRouter } from "next/navigation";
// import { useTranslation } from "react-i18next";

// export default function ChildrenManagement() {
//   const [children, setChildren] = useState<Child[]>([]);
//   const [fathers, setFathers] = useState<Father[]>([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState<string | null>(null);
//   const [alert, setAlert] = useState<{ type: "success" | "error"; message: string } | null>(null);
//   const router = useRouter();
//   const [searchQuery, setSearchQuery] = useState("");
//   const [isDialogOpen, setIsDialogOpen] = useState(false);
//   const [isChangeFatherDialogOpen, setIsChangeFatherDialogOpen] = useState(false);
//   const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
//   const [isHistoryDialogOpen, setIsHistoryDialogOpen] = useState(false);
//   const [transferHistory, setTransferHistory] = useState<any[]>([]);
//   const [historyLoading, setHistoryLoading] = useState(false);
//   const [selectedChild, setSelectedChild] = useState<Child | null>(null);
//   const [isSubmitting, setIsSubmitting] = useState(false);
//   const { t } = useTranslation();

//   const handleViewHistory = async (child: Child) => {
//     setSelectedChild(child);
//     setIsHistoryDialogOpen(true);
//     setHistoryLoading(true);
//     try {
//       const response = await fetchFatherTransfersByChild(child.id);
//       const data = (response as any)?.data;
//       setTransferHistory(Array.isArray(data) ? data : []);
//     } catch (err) {
//       setTransferHistory([]);
//     } finally {
//       setHistoryLoading(false);
//     }
//   };

//   const [formState, setFormState] = useState({
//     firstName: "",
//     middleName: "",
//     lastName: "",
//     phoneNumber: "",
//     dateOfBirth: "",
//     gender: "",
//     fatherId: "",
//   });

//   const [changeFatherState, setChangeFatherState] = useState({
//     newFatherId: "",
//     reason: "",
//   });

//   const loadData = useCallback(async () => {
//     setLoading(true);
//     setError(null);
//     try {
//       const [childrenData, fathersData] = await Promise.all([
//         fetchChildren(),
//         fetchFathersForDropdown(),
//       ]);
      
//       console.log('Children Data:', childrenData);
//       console.log('Fathers Data:', fathersData);
      
//       // Handle paginated response for children
//       let childrenArray = [];
//       if (childrenData) {
//         if (Array.isArray(childrenData)) {
//           childrenArray = childrenData;
//         } else if (childrenData.content && Array.isArray(childrenData.content)) {
//           childrenArray = childrenData.content;
//         } else if (typeof childrenData === 'object' && childrenData !== null) {
//           // Try to find any array property
//           const possibleArrays = Object.values(childrenData).filter(val => Array.isArray(val));
//           if (possibleArrays.length > 0) {
//             childrenArray = possibleArrays[0];
//           }
//         }
//       }
      
//       // Handle paginated response for fathers
//       let fathersArray = [];
//       if (fathersData) {
//         if (Array.isArray(fathersData)) {
//           fathersArray = fathersData;
//         } else if (fathersData.content && Array.isArray(fathersData.content)) {
//           fathersArray = fathersData.content;
//         } else if (typeof fathersData === 'object' && fathersData !== null) {
//           // Try to find any array property
//           const possibleArrays = Object.values(fathersData).filter(val => Array.isArray(val));
//           if (possibleArrays.length > 0) {
//             fathersArray = possibleArrays[0];
//           }
//         }
//       }
      
//       console.log('Processed Children:', childrenArray);
//       console.log('Processed Fathers:', fathersArray);
      
//       setChildren(childrenArray);
//       setFathers(fathersArray);
//     } catch (err: any) {
//       console.error('Error loading data:', err);
//       setError("Failed to load data. " + err.message);
//       setChildren([]);
//       setFathers([]);
//     } finally {
//       setLoading(false);
//     }
//   }, []);

//   useEffect(() => {
//     loadData();
//   }, [loadData]);

//   const filteredChildren = useMemo(() => {
//     if (!Array.isArray(children)) {
//       return [];
//     }
    
//     const query = searchQuery.toLowerCase().trim();
//     if (!query) {
//       return children;
//     }
    
//     return children.filter((child) => {
//       const fullName = `${child.firstName} ${child.middleName || ''} ${child.lastName}`.toLowerCase();
//       const phone = child.phoneNumber?.toLowerCase() || '';
      
//       return fullName.includes(query) || phone.includes(query);
//     });
//   }, [children, searchQuery]);

//   const columns: ColumnDef<Child>[] = [
//     {
//       accessorKey: "fullName",
//       header: t("Child Name"),
//       cell: ({ row }) => (
//         <div className="flex items-center gap-3">
//           <div className="p-2 bg-primary/10 rounded-lg">
//             <UserRound className="h-5 w-5 text-primary" />
//           </div>
//           <div>
//             <div className="font-semibold">
//               {row.original.fullName}
//             </div>
            
//           </div>
//         </div>
//       ),
//     },
//     {
//       accessorKey: "gender",
//       header: t("Gender"),
//       cell: ({ row }) => (
//         <Badge variant="outline">
//           {row.original.gender === "MALE" ? "Male" : row.original.gender === "FEMALE" ? "Female" : row.original.gender}
//         </Badge>
//       ),
//     },
//     {
//       accessorKey: "dateOfBirth",
//       header: t("Date of Birth"),
//       cell: ({ row }) => (
//         <div className="flex items-center gap-2">
//           <Calendar className="h-3 w-3 text-muted-foreground" />
//           <span className="text-sm">
//             {row.original.dateOfBirth ? new Date(row.original.dateOfBirth).toLocaleDateString() : '-'}
//           </span>
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
//       accessorKey: "fatherName",
//       header: t("Father"),
//       cell: ({ row }) => (
//         <div className="flex items-center gap-2">
//           <User className="h-3 w-3 text-muted-foreground" />
//           <span className="text-sm">
//             {row.original.fatherName || (row.original.fatherId ? `Father ID: ${row.original.fatherId}` : 'No Father')}
//           </span>
//         </div>
//       ),
//     },
//     {
//       id: "actions",
//       cell: ({ row }) => (
//         <div className="flex gap-2">
//           <Button
//             size="sm"
//             variant="ghost"
//             title={t("Change Father")}
//             onClick={() => {
//               setSelectedChild(row.original);
//               setChangeFatherState({ newFatherId: "", reason: "" });
//               setIsChangeFatherDialogOpen(true);
//             }}
//           >
//             <GitBranch className="h-4 w-4" />
//           </Button>
//           <Button
//             size="sm"
//             variant="ghost"
//             title={t("Transfer History")}
//             onClick={() => handleViewHistory(row.original)}
//           >
//             <History className="h-4 w-4" />
//           </Button>
//           <Button
//             size="sm"
//             variant="ghost"
//             title={t("Record Payment")}
//             onClick={() => router.push(`/payments?childId=${row.original.id}`)}
//           >
//             <Banknote className="h-4 w-4" />
//           </Button>
//           <Button
//             size="sm"
//             variant="ghost"
//             title={t("Generate Certificate")}
//             onClick={() => router.push(`/certificates?childId=${row.original.id}`)}
//           >
//             <FileText className="h-4 w-4" />
//           </Button>
//           <Button
//             size="sm"
//             variant="ghost"
//             className="text-red-600 hover:text-red-700 hover:bg-red-50"
//             onClick={() => {
//               setSelectedChild(row.original);
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
//       dateOfBirth: "",
//       gender: "",
//       fatherId: "",
//     });
//     setIsDialogOpen(true);
//   };

//   const handleSubmit = async () => {
//     if (!formState.firstName || !formState.lastName || !formState.dateOfBirth || !formState.gender || !formState.fatherId) {
//       setAlert({ type: "error", message: "Please fill all required fields" });
//       return;
//     }

//     setIsSubmitting(true);
//     setAlert(null);

//     try {
//       await createChild(formState);
//       setAlert({ type: "success", message: "Child registered successfully!" });
//       await loadData();
//       setIsDialogOpen(false);
//       setTimeout(() => setAlert(null), 3000);
//     } catch (err: any) {
//       setAlert({ type: "error", message: err.message || "Operation failed" });
//     } finally {
//       setIsSubmitting(false);
//     }
//   };

//   const handleChangeFather = async () => {
//     if (!selectedChild || !changeFatherState.newFatherId || !changeFatherState.reason) {
//       setAlert({ type: "error", message: "Please select a new father and provide a reason" });
//       return;
//     }

//     setIsSubmitting(true);
//     setAlert(null);

//     try {
//       await changeFather(selectedChild.id, changeFatherState.newFatherId, changeFatherState.reason);
//       setAlert({ type: "success", message: "Father changed successfully!" });
//       await loadData();
//       setIsChangeFatherDialogOpen(false);
//       setTimeout(() => setAlert(null), 3000);
//     } catch (err: any) {
//       setAlert({ type: "error", message: err.message || "Operation failed" });
//     } finally {
//       setIsSubmitting(false);
//     }
//   };

//   const handleDelete = async () => {
//     if (!selectedChild) return;

//     setIsSubmitting(true);
//     try {
//       await deleteChild(selectedChild.id);
//       setAlert({ type: "success", message: "Child deleted successfully!" });
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
//             <h1 className="text-3xl font-bold">{t("Children")}</h1>
//             <p className="text-muted-foreground">{t("Manage children and their father assignments")}</p>
//           </div>
//           <Button onClick={handleAdd} size="lg">
//             <Plus className="h-5 w-5 mr-2" /> {t("Register Child")}
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
//               placeholder={t("Search by name or phone...")}
//               value={searchQuery}
//               onChange={(e) => setSearchQuery(e.target.value)}
//               className="pl-10"
//             />
//           </div>
//           <Button variant="outline" size="icon" onClick={loadData} disabled={loading}>
//             <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
//           </Button>
//         </div>

//         {loading ? (
//           <div className="flex justify-center items-center h-64">
//             <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
//           </div>
//         ) : (
//           <DataTable columns={columns} data={filteredChildren} />
//         )}

//         {/* Add Child Dialog */}
//         <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
//           <DialogContent className="sm:max-w-lg">
//             <DialogHeader>
//               <DialogTitle className="text-2xl">{t("Register New Child")}</DialogTitle>
//             </DialogHeader>
//             <div className="space-y-4 py-4">
//               <div className="grid grid-cols-2 gap-4">
//                 <div>
//                   <Label>{t("First Name")} *</Label>
//                   <Input
//                     value={formState.firstName}
//                     onChange={(e) => setFormState({ ...formState, firstName: e.target.value })}
//                     placeholder="First name"
//                   />
//                 </div>
//                 <div>
//                   <Label>{t("Middle Name")}</Label>
//                   <Input
//                     value={formState.middleName}
//                     onChange={(e) => setFormState({ ...formState, middleName: e.target.value })}
//                     placeholder="Middle name"
//                   />
//                 </div>
//               </div>
//               <div>
//                 <Label>{t("Last Name")} *</Label>
//                 <Input
//                   value={formState.lastName}
//                   onChange={(e) => setFormState({ ...formState, lastName: e.target.value })}
//                   placeholder="Last name"
//                 />
//               </div>
//               <div>
//                 <Label>{t("Phone Number")}</Label>
//                 <Input
//                   type="tel"
//                   value={formState.phoneNumber}
//                   onChange={(e) => setFormState({ ...formState, phoneNumber: e.target.value })}
//                   placeholder="Phone number"
//                 />
//               </div>
//               <div>
//                 <Label>{t("Date of Birth")} *</Label>
//                 <Input
//                   type="date"
//                   value={formState.dateOfBirth}
//                   onChange={(e) => setFormState({ ...formState, dateOfBirth: e.target.value })}
//                 />
//               </div>
//               <div>
//                 <Label>{t("Gender")} *</Label>
//                 <Select
//                   value={formState.gender}
//                   onValueChange={(v) => setFormState({ ...formState, gender: v })}
//                 >
//                   <SelectTrigger>
//                     <SelectValue placeholder="Select gender" />
//                   </SelectTrigger>
//                   <SelectContent>
//                     <SelectItem value="MALE">Male</SelectItem>
//                     <SelectItem value="FEMALE">Female</SelectItem>
//                   </SelectContent>
//                 </Select>
//               </div>
//               <div>
//                 <Label>{t("Father")} *</Label>
//                 <Select
//                   value={formState.fatherId}
//                   onValueChange={(v) => setFormState({ ...formState, fatherId: v })}
//                 >
//                   <SelectTrigger>
//                     <SelectValue placeholder="Select father" />
//                   </SelectTrigger>
//                   <SelectContent>
//                     {fathers && fathers.length > 0 ? (
//                       fathers.map((father) => (
//                         <SelectItem key={father.id} value={father.id}>
//                           {father.firstName} {father.middleName || ''} {father.lastName}
//                           {father.churchName ? ` - ${father.churchName}` : ''}
//                         </SelectItem>
//                       ))
//                     ) : (
//                       <SelectItem value="no-fathers" disabled className="text-muted-foreground">
//                         No fathers available
//                       </SelectItem>
//                     )}
//                   </SelectContent>
//                 </Select>
//               </div>
//             </div>
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

//         {/* Change Father Dialog */}
//         <Dialog open={isChangeFatherDialogOpen} onOpenChange={setIsChangeFatherDialogOpen}>
//           <DialogContent className="sm:max-w-lg">
//             <DialogHeader>
//               <DialogTitle>{t("Change Father")}</DialogTitle>
//             </DialogHeader>
//             <div className="space-y-4 py-4">
//               <div>
//                 <Label>{t("Current Child")}</Label>
//                 <Input
//                   value={selectedChild ? `${selectedChild.firstName} ${selectedChild.lastName}` : ""}
//                   disabled
//                 />
//               </div>
//               <div>
//                 <Label>{t("New Father")} *</Label>
//                 <Select
//                   value={changeFatherState.newFatherId}
//                   onValueChange={(v) => setChangeFatherState({ ...changeFatherState, newFatherId: v })}
//                 >
//                   <SelectTrigger>
//                     <SelectValue placeholder="Select new father" />
//                   </SelectTrigger>
//                   <SelectContent>
//                     {fathers && fathers.length > 0 ? (
//                       fathers.map((father) => (
//                         <SelectItem key={father.id} value={father.id}>
//                           {father.firstName} {father.middleName || ''} {father.lastName}
//                           {father.churchName ? ` - ${father.churchName}` : ''}
//                         </SelectItem>
//                       ))
//                     ) : (
//                       <SelectItem value="no-fathers" disabled className="text-muted-foreground">
//                         No fathers available
//                       </SelectItem>
//                     )}
//                   </SelectContent>
//                 </Select>
//               </div>
//               <div>
//                 <Label>{t("Reason")} *</Label>
//                 <Input
//                   value={changeFatherState.reason}
//                   onChange={(e) => setChangeFatherState({ ...changeFatherState, reason: e.target.value })}
//                   placeholder="Reason for changing father"
//                 />
//               </div>
//             </div>
//             <DialogFooter>
//               <Button variant="outline" onClick={() => setIsChangeFatherDialogOpen(false)} disabled={isSubmitting}>
//                 {t("Cancel")}
//               </Button>
//               <Button onClick={handleChangeFather} disabled={isSubmitting}>
//                 {isSubmitting ? t("Changing...") : t("Change Father")}
//               </Button>
//             </DialogFooter>
//           </DialogContent>
//         </Dialog>

//         {/* Transfer History Dialog */}
//         <Dialog open={isHistoryDialogOpen} onOpenChange={setIsHistoryDialogOpen}>
//           <DialogContent className="sm:max-w-lg max-h-[80vh] overflow-y-auto">
//             <DialogHeader>
//               <DialogTitle className="flex items-center gap-2">
//                 <History className="h-5 w-5 text-primary" /> {t("Father Transfer History")}
//               </DialogTitle>
//             </DialogHeader>
//             <p className="text-sm text-muted-foreground">
//               {t("For")} <strong>{selectedChild?.fullName || selectedChild?.firstName}</strong>
//             </p>
//             {historyLoading ? (
//               <div className="flex justify-center py-8">
//                 <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
//               </div>
//             ) : transferHistory.length === 0 ? (
//               <div className="text-center text-muted-foreground py-8 text-sm">
//                 {t("No transfer history recorded for this child.")}
//               </div>
//             ) : (
//               <div className="space-y-3">
//                 {transferHistory.map((tr: any, idx: number) => (
//                   <div key={tr.id || idx} className="bg-muted p-3 rounded-lg text-sm space-y-1">
//                     <p><strong>{t("Reason")}:</strong> {tr.reason || "-"}</p>
//                     <p><strong>{t("New Father ID")}:</strong> {tr.newFatherId || "-"}</p>
//                     {tr.transferDate && (
//                       <p><strong>{t("Date")}:</strong> {new Date(tr.transferDate).toLocaleString()}</p>
//                     )}
//                   </div>
//                 ))}
//               </div>
//             )}
//             <DialogFooter>
//               <Button onClick={() => setIsHistoryDialogOpen(false)}>{t("Close")}</Button>
//             </DialogFooter>
//           </DialogContent>
//         </Dialog>

//         {/* Delete Confirmation Dialog */}
//         <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
//           <DialogContent>
//             <DialogHeader>
//               <DialogTitle>{t("Delete Child?")}</DialogTitle>
//             </DialogHeader>
//             <p className="text-muted-foreground">
//               {t("Are you sure you want to delete")} <strong>{selectedChild?.firstName} {selectedChild?.lastName}</strong>?
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
import { toast } from "sonner";
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
  User,
  UserRound,
  GitBranch,
  History,
  Banknote,
  FileText,
  Eye,
  Info,
  Users2,
  UserCheck,
  UserX,
  CalendarDays,
  Hash,
  QrCode,
  Link2,
  Shield,
  IdCard,
  Upload,
  Printer,
  Download,
  MoreVertical,
} from "lucide-react";
import { useRef } from "react";
import { useReactToPrint } from "react-to-print";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

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
  fetchChildren,
  createChild,
  changeFather,
  deleteChild,
  Child,
} from "@/services/childrenService";
import { fetchFathersForDropdown, Father } from "@/services/fatherService";
import { fetchFatherTransfersByChild } from "@/services/fatherTransferService";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";

export default function ChildrenManagement() {
  const [children, setChildren] = useState<Child[]>([]);
  const [fathers, setFathers] = useState<Father[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isChangeFatherDialogOpen, setIsChangeFatherDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isHistoryDialogOpen, setIsHistoryDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [transferHistory, setTransferHistory] = useState<any[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [selectedChild, setSelectedChild] = useState<Child | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isIdCardDialogOpen, setIsIdCardDialogOpen] = useState(false);
  const [idCardChild, setIdCardChild] = useState<Child | null>(null);
  const [idCardPhoto, setIdCardPhoto] = useState<string | null>(null);
  const idCardRef = useRef<HTMLDivElement>(null);
  const { t } = useTranslation();

  const handlePrintIdCard = useReactToPrint({
    contentRef: idCardRef,
    documentTitle: idCardChild
      ? `ID-${idCardChild.sebekaMemberId || idCardChild.id}`
      : "ID-Card",
  });

  const handleGenerateId = (child: Child) => {
    setIdCardChild(child);
    setIdCardPhoto(null);
    setIsIdCardDialogOpen(true);
  };

  const handleIdPhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setIdCardPhoto(reader.result as string);
    reader.readAsDataURL(file);
  };

  const getIdCardQrUrl = (child: Child) => {
    const qrData = JSON.stringify({
      id: child.id,
      sebekaId: (child as any).sebekaMemberId || child.id,
      name:
        child.fullName ||
        `${child.firstName || ""} ${child.middleName || ""} ${child.lastName || ""}`.trim(),
      christianName: (child as any).christianName || "",
      dob: child.dateOfBirth,
      fatherName: child.fatherName || "",
      phone: child.phoneNumber || "",
      church: (child as any).churchName || "",
    });
    return `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(qrData)}`;
  };

  const handleViewHistory = async (child: Child) => {
    setSelectedChild(child);
    setIsHistoryDialogOpen(true);
    setHistoryLoading(true);
    try {
      const response = await fetchFatherTransfersByChild(child.id);
      const data = (response as any)?.data;
      setTransferHistory(Array.isArray(data) ? data : []);
    } catch (err) {
      setTransferHistory([]);
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleViewDetails = (child: Child) => {
    setSelectedChild(child);
    setIsViewDialogOpen(true);
  };

  const [formState, setFormState] = useState({
    firstName: "",
    middleName: "",
    lastName: "",
    phoneNumber: "",
    dateOfBirth: "",
    gender: "",
    fatherId: "",
  });

  const [changeFatherState, setChangeFatherState] = useState({
    newFatherId: "",
    reason: "",
  });

  const loadData = useCallback(async (search?: string) => {
    setLoading(true);
    setError(null);
    try {
      const [childrenData, fathersData] = await Promise.all([
        fetchChildren(search),
        fetchFathersForDropdown(),
      ]);
      
      console.log('Children Data:', childrenData);
      console.log('Fathers Data:', fathersData);
      
      // Handle paginated response for children
      let childrenArray = [];
      if (childrenData) {
        if (Array.isArray(childrenData)) {
          childrenArray = childrenData;
        } else if (childrenData.content && Array.isArray(childrenData.content)) {
          childrenArray = childrenData.content;
        } else if (typeof childrenData === 'object' && childrenData !== null) {
          // Try to find any array property
          const possibleArrays = Object.values(childrenData).filter(val => Array.isArray(val));
          if (possibleArrays.length > 0) {
            childrenArray = possibleArrays[0];
          }
        }
      }
      
      // Handle paginated response for fathers
      let fathersArray = [];
      if (fathersData) {
        if (Array.isArray(fathersData)) {
          fathersArray = fathersData;
        } else if (fathersData.content && Array.isArray(fathersData.content)) {
          fathersArray = fathersData.content;
        } else if (typeof fathersData === 'object' && fathersData !== null) {
          // Try to find any array property
          const possibleArrays = Object.values(fathersData).filter(val => Array.isArray(val));
          if (possibleArrays.length > 0) {
            fathersArray = possibleArrays[0];
          }
        }
      }
      
      console.log('Processed Children:', childrenArray);
      console.log('Processed Fathers:', fathersArray);
      
      setChildren(childrenArray);
      setFathers(fathersArray);
    } catch (err: any) {
      console.error('Error loading data:', err);
      setError("Failed to load data. " + err.message);
      setChildren([]);
      setFathers([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

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
      loadData(searchQuery);
    }, 400);
    return () => clearTimeout(handle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery]);

  const filteredChildren = useMemo(() => {
    if (!Array.isArray(children)) {
      return [];
    }

    const query = searchQuery.toLowerCase().trim();
    if (!query) {
      return children;
    }

    return children.filter((child) => {
      const fullName = (
        child.fullName ||
        `${child.firstName || ''} ${child.middleName || ''} ${child.lastName || ''}`
      ).toLowerCase();
      const phone = child.phoneNumber?.toLowerCase() || '';
      const sebekaId = child.sebekaMemberId?.toLowerCase() || '';

      return fullName.includes(query) || phone.includes(query) || sebekaId.includes(query);
    });
  }, [children, searchQuery]);

  const getFamilyStatusBadge = (status: string) => {
    const statusMap: Record<string, { variant: "default" | "secondary" | "destructive" | "outline"; label: string }> = {
      "FAMILY_HEAD": { variant: "default", label: "Family Head" },
      "FAMILY_MEMBER": { variant: "secondary", label: "Family Member" },
      "NO_FAMILY": { variant: "outline", label: "No Family" },
    };
    const config = statusMap[status] || { variant: "outline", label: status };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getActiveBadge = (active: boolean) => {
    return active ? (
      <Badge variant="default" className="bg-green-500 hover:bg-green-600">
        <CheckCircle className="h-3 w-3 mr-1" /> Active
      </Badge>
    ) : (
      <Badge variant="destructive">
        <XCircle className="h-3 w-3 mr-1" /> Inactive
      </Badge>
    );
  };

  const columns: ColumnDef<Child>[] = [
    {
      accessorKey: "fullName",
      header: t("Child Name"),
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <UserRound className="h-5 w-5 text-primary" />
          </div>
          <div>
            <div className="font-semibold">
              {row.original.fullName}
            </div>
            {row.original.sebekaMemberId && (
              <div className="text-xs text-muted-foreground">
                {row.original.sebekaMemberId}
              </div>
            )}
          </div>
        </div>
      ),
    },
    {
      accessorKey: "gender",
      header: t("Gender"),
      cell: ({ row }) => (
        <Badge variant="outline">
          {row.original.gender === "MALE" ? "Male" : row.original.gender === "FEMALE" ? "Female" : row.original.gender}
        </Badge>
      ),
    },
    {
      accessorKey: "dateOfBirth",
      header: t("Date of Birth"),
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Calendar className="h-3 w-3 text-muted-foreground" />
          <span className="text-sm">
            {row.original.dateOfBirth ? new Date(row.original.dateOfBirth).toLocaleDateString() : '-'}
          </span>
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
      accessorKey: "fatherName",
      header: t("Father"),
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <User className="h-3 w-3 text-muted-foreground" />
          <span className="text-sm">
            {row.original.fatherName || (row.original.fatherId ? `Father ID: ${row.original.fatherId}` : 'No Father')}
          </span>
        </div>
      ),
    },
    {
      accessorKey: "familyStatus",
      header: t("Family Status"),
      cell: ({ row }) => getFamilyStatusBadge(row.original.familyStatus || "NO_FAMILY"),
    },
    {
      accessorKey: "active",
      header: t("Status"),
      cell: ({ row }) => getActiveBadge(row.original.active || false),
    },
    {
      id: "actions",
      cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button size="sm" variant="ghost">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => handleViewDetails(row.original)}>
              <Eye className="h-4 w-4 mr-2" /> {t("View Details")}
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => {
                setSelectedChild(row.original);
                setChangeFatherState({ newFatherId: "", reason: "" });
                setIsChangeFatherDialogOpen(true);
              }}
            >
              <GitBranch className="h-4 w-4 mr-2" /> {t("Change Father")}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleViewHistory(row.original)}>
              <History className="h-4 w-4 mr-2" /> {t("Transfer History")}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => router.push(`/payments?childId=${row.original.id}`)}>
              <Banknote className="h-4 w-4 mr-2" /> {t("Record Payment")}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => router.push(`/certificates?childId=${row.original.id}`)}>
              <FileText className="h-4 w-4 mr-2" /> {t("Generate Certificate")}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleGenerateId(row.original)}>
              <IdCard className="h-4 w-4 mr-2" /> {t("Generate ID Card")}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-red-600 focus:text-red-600"
              onClick={() => {
                setSelectedChild(row.original);
                setIsDeleteDialogOpen(true);
              }}
            >
              <Trash2 className="h-4 w-4 mr-2" /> {t("Delete")}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  const handleAdd = () => {
    setFormState({
      firstName: "",
      middleName: "",
      lastName: "",
      phoneNumber: "",
      dateOfBirth: "",
      gender: "",
      fatherId: "",
    });
    setFormErrors({});
    setIsDialogOpen(true);
  };

  const validateFormState = () => {
    const errors: Record<string, string> = {};
    if (!formState.firstName) errors.firstName = t("First name is required");
    if (!formState.lastName) errors.lastName = t("Last name is required");
    if (!formState.dateOfBirth) errors.dateOfBirth = t("Date of birth is required");
    if (!formState.gender) errors.gender = t("Gender is required");
    if (!formState.fatherId) errors.fatherId = t("Please select a father");
    return errors;
  };

  const handleSubmit = async () => {
    const errors = validateFormState();
    setFormErrors(errors);
    if (Object.keys(errors).length > 0) {
      toast.error(t("Please fill all required fields"));
      return;
    }

    setIsSubmitting(true);

    try {
      await createChild(formState);
      toast.success(t("Child registered successfully!"));
      await loadData();
      setIsDialogOpen(false);
      setFormErrors({});
    } catch (err: any) {
      toast.error(err.message || t("Operation failed"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChangeFather = async () => {
    if (!selectedChild || !changeFatherState.newFatherId || !changeFatherState.reason) {
      toast.error("Please select a new father and provide a reason");
      return;
    }

    setIsSubmitting(true);

    try {
      await changeFather(selectedChild.id, changeFatherState.newFatherId, changeFatherState.reason);
      toast.success("Father changed successfully!");
      await loadData();
      setIsChangeFatherDialogOpen(false);
    } catch (err: any) {
      toast.error(err.message || "Operation failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedChild) return;

    setIsSubmitting(true);
    try {
      await deleteChild(selectedChild.id);
      toast.success("Child deleted successfully!");
      await loadData();
    } catch (err: any) {
      toast.error(err.message || "Delete failed");
    } finally {
      setIsSubmitting(false);
      setIsDeleteDialogOpen(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold">{t("Children")}</h1>
            <p className="text-muted-foreground">{t("Manage children and their father assignments")}</p>
          </div>
          <Button onClick={handleAdd} size="lg">
            <Plus className="h-5 w-5 mr-2" /> {t("Register Child")}
          </Button>
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t("Search by name, phone or Sebeka ID...")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button variant="outline" size="icon" onClick={() => loadData()} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <DataTable columns={columns} data={filteredChildren} />
        )}

        {/* View Details Dialog */}
        <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
          <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-2xl">
                <UserRound className="h-6 w-6 text-primary" />
                {t("Child Details")}
              </DialogTitle>
            </DialogHeader>
            
            {selectedChild && (
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
                        <p className="font-semibold">{selectedChild.fullName}</p>
                      </div>
                      <div>
                        <Label className="text-muted-foreground">{t("Sebeka Member ID")}</Label>
                        <p className="font-semibold">{selectedChild.sebekaMemberId || "-"}</p>
                      </div>
                      <div>
                        <Label className="text-muted-foreground">{t("Gender")}</Label>
                        <p className="font-semibold">{selectedChild.gender || "-"}</p>
                      </div>
                      <div>
                        <Label className="text-muted-foreground">{t("Date of Birth")}</Label>
                        <p className="font-semibold">
                          {selectedChild.dateOfBirth ? new Date(selectedChild.dateOfBirth).toLocaleDateString() : "-"}
                        </p>
                      </div>
                      <div>
                        <Label className="text-muted-foreground">{t("Phone Number")}</Label>
                        <p className="font-semibold">{selectedChild.phoneNumber || "-"}</p>
                      </div>
                      <div>
                        <Label className="text-muted-foreground">{t("Father Name")}</Label>
                        <p className="font-semibold">{selectedChild.fatherName || "-"}</p>
                      </div>
                      <div>
                        <Label className="text-muted-foreground">{t("Family Status")}</Label>
                        <div className="mt-1">{getFamilyStatusBadge(selectedChild.familyStatus || "NO_FAMILY")}</div>
                      </div>
                      <div>
                        <Label className="text-muted-foreground">{t("Status")}</Label>
                        <div className="mt-1">{getActiveBadge(selectedChild.active || false)}</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* QR Code Card */}
                {selectedChild.qrCode && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <QrCode className="h-5 w-5 text-primary" />
                        {t("QR Code")}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center gap-6">
                        <img 
                          src={selectedChild.qrCode} 
                          alt="QR Code" 
                          className="w-32 h-32 border rounded-lg"
                        />
                        {selectedChild.qrLink && (
                          <div>
                            <Label className="text-muted-foreground">{t("QR Link")}</Label>
                            <p className="text-sm text-blue-600 break-all">{selectedChild.qrLink}</p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Family Information Card */}
                {selectedChild.family ? (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Users2 className="h-5 w-5 text-primary" />
                        {t("Family Information")}
                      </CardTitle>
                      <CardDescription>
                        {t("Family Head:")} {selectedChild.family.fullName || selectedChild.family.familyHeadId}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                          <Label className="text-muted-foreground">{t("Family Head ID")}</Label>
                          <p className="font-semibold">{selectedChild.family.familyHeadId}</p>
                        </div>
                        <div>
                          <Label className="text-muted-foreground">{t("Family Sebeka ID")}</Label>
                          <p className="font-semibold">{selectedChild.family.sebekaMemberId}</p>
                        </div>
                      </div>

                      {selectedChild.family.members && selectedChild.family.members.length > 0 && (
                        <div className="mt-4">
                          <Label className="text-muted-foreground mb-2 block">{t("Family Members")}</Label>
                          <ScrollArea className="h-[200px] rounded-md border">
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead>{t("Name")}</TableHead>
                                  <TableHead>{t("Relation")}</TableHead>
                                  <TableHead>{t("Existing Child ID")}</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {selectedChild.family.members.map((member, index) => (
                                  <TableRow key={index}>
                                    <TableCell className="font-medium">{member.fullName}</TableCell>
                                    <TableCell>
                                      <Badge variant="outline">{member.relationType}</Badge>
                                    </TableCell>
                                    <TableCell>{member.existingChildId || "-"}</TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </ScrollArea>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ) : (
                  <Card>
                    <CardContent className="py-8">
                      <div className="text-center text-muted-foreground">
                        <UserX className="h-12 w-12 mx-auto mb-2 opacity-50" />
                        <p>{t("No family information available")}</p>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Quick Actions */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Shield className="h-5 w-5 text-primary" />
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
                          setSelectedChild(selectedChild);
                          setChangeFatherState({ newFatherId: "", reason: "" });
                          setIsChangeFatherDialogOpen(true);
                        }}
                      >
                        <GitBranch className="h-4 w-4 mr-2" />
                        {t("Change Father")}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setIsViewDialogOpen(false);
                          handleViewHistory(selectedChild);
                        }}
                      >
                        <History className="h-4 w-4 mr-2" />
                        {t("Transfer History")}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setIsViewDialogOpen(false);
                          router.push(`/payments?childId=${selectedChild.id}`);
                        }}
                      >
                        <Banknote className="h-4 w-4 mr-2" />
                        {t("Record Payment")}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setIsViewDialogOpen(false);
                          router.push(`/certificates?childId=${selectedChild.id}`);
                        }}
                      >
                        <FileText className="h-4 w-4 mr-2" />
                        {t("Generate Certificate")}
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

        {/* Add Child Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle className="text-2xl">{t("Register New Child")}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>{t("First Name")} *</Label>
                  <Input
                    value={formState.firstName}
                    onChange={(e) => {
                      setFormState({ ...formState, firstName: e.target.value });
                      if (formErrors.firstName) setFormErrors({ ...formErrors, firstName: "" });
                    }}
                    placeholder="First name"
                    aria-invalid={!!formErrors.firstName}
                    className={formErrors.firstName ? "border-destructive focus-visible:ring-destructive" : ""}
                  />
                  {formErrors.firstName && (
                    <p className="text-xs text-destructive mt-1">{formErrors.firstName}</p>
                  )}
                </div>
                <div>
                  <Label>{t("Middle Name")}</Label>
                  <Input
                    value={formState.middleName}
                    onChange={(e) => setFormState({ ...formState, middleName: e.target.value })}
                    placeholder="Middle name"
                  />
                </div>
              </div>
              <div>
                <Label>{t("Last Name")} *</Label>
                <Input
                  value={formState.lastName}
                  onChange={(e) => {
                    setFormState({ ...formState, lastName: e.target.value });
                    if (formErrors.lastName) setFormErrors({ ...formErrors, lastName: "" });
                  }}
                  placeholder="Last name"
                  aria-invalid={!!formErrors.lastName}
                  className={formErrors.lastName ? "border-destructive focus-visible:ring-destructive" : ""}
                />
                {formErrors.lastName && (
                  <p className="text-xs text-destructive mt-1">{formErrors.lastName}</p>
                )}
              </div>
              <div>
                <Label>{t("Phone Number")}</Label>
                <Input
                  type="tel"
                  value={formState.phoneNumber}
                  onChange={(e) => setFormState({ ...formState, phoneNumber: e.target.value })}
                  placeholder="Phone number"
                />
              </div>
              <div>
                <Label>{t("Date of Birth")} *</Label>
                <Input
                  type="date"
                  value={formState.dateOfBirth}
                  onChange={(e) => {
                    setFormState({ ...formState, dateOfBirth: e.target.value });
                    if (formErrors.dateOfBirth) setFormErrors({ ...formErrors, dateOfBirth: "" });
                  }}
                  aria-invalid={!!formErrors.dateOfBirth}
                  className={formErrors.dateOfBirth ? "border-destructive focus-visible:ring-destructive" : ""}
                />
                {formErrors.dateOfBirth && (
                  <p className="text-xs text-destructive mt-1">{formErrors.dateOfBirth}</p>
                )}
              </div>
              <div>
                <Label>{t("Gender")} *</Label>
                <Select
                  value={formState.gender}
                  onValueChange={(v) => {
                    setFormState({ ...formState, gender: v });
                    if (formErrors.gender) setFormErrors({ ...formErrors, gender: "" });
                  }}
                >
                  <SelectTrigger className={formErrors.gender ? "border-destructive focus-visible:ring-destructive" : ""}>
                    <SelectValue placeholder="Select gender" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MALE">Male</SelectItem>
                    <SelectItem value="FEMALE">Female</SelectItem>
                  </SelectContent>
                </Select>
                {formErrors.gender && (
                  <p className="text-xs text-destructive mt-1">{formErrors.gender}</p>
                )}
              </div>
              <div>
                <Label>{t("Father")} *</Label>
                <Select
                  value={formState.fatherId}
                  onValueChange={(v) => {
                    setFormState({ ...formState, fatherId: v });
                    if (formErrors.fatherId) setFormErrors({ ...formErrors, fatherId: "" });
                  }}
                >
                  <SelectTrigger className={formErrors.fatherId ? "border-destructive focus-visible:ring-destructive" : ""}>
                    <SelectValue placeholder="Select father" />
                  </SelectTrigger>
                  <SelectContent>
                    {fathers && fathers.length > 0 ? (
                      fathers.map((father) => (
                        <SelectItem key={father.id} value={father.id}>
                          {father.firstName} {father.middleName || ''} {father.lastName}
                          {father.churchName ? ` - ${father.churchName}` : ''}
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="no-fathers" disabled className="text-muted-foreground">
                        No fathers available
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
                {formErrors.fatherId && (
                  <p className="text-xs text-destructive mt-1">{formErrors.fatherId}</p>
                )}
              </div>
            </div>
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

        {/* Change Father Dialog */}
        <Dialog open={isChangeFatherDialogOpen} onOpenChange={setIsChangeFatherDialogOpen}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>{t("Change Father")}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <Label>{t("Current Child")}</Label>
                <Input
                  value={selectedChild ? `${selectedChild.firstName} ${selectedChild.lastName}` : ""}
                  disabled
                />
              </div>
              <div>
                <Label>{t("New Father")} *</Label>
                <Select
                  value={changeFatherState.newFatherId}
                  onValueChange={(v) => setChangeFatherState({ ...changeFatherState, newFatherId: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select new father" />
                  </SelectTrigger>
                  <SelectContent>
                    {fathers && fathers.length > 0 ? (
                      fathers.map((father) => (
                        <SelectItem key={father.id} value={father.id}>
                          {father.firstName} {father.middleName || ''} {father.lastName}
                          {father.churchName ? ` - ${father.churchName}` : ''}
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="no-fathers" disabled className="text-muted-foreground">
                        No fathers available
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>{t("Reason")} *</Label>
                <Input
                  value={changeFatherState.reason}
                  onChange={(e) => setChangeFatherState({ ...changeFatherState, reason: e.target.value })}
                  placeholder="Reason for changing father"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsChangeFatherDialogOpen(false)} disabled={isSubmitting}>
                {t("Cancel")}
              </Button>
              <Button onClick={handleChangeFather} disabled={isSubmitting}>
                {isSubmitting ? t("Changing...") : t("Change Father")}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Transfer History Dialog */}
        <Dialog open={isHistoryDialogOpen} onOpenChange={setIsHistoryDialogOpen}>
          <DialogContent className="sm:max-w-lg max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <History className="h-5 w-5 text-primary" /> {t("Father Transfer History")}
              </DialogTitle>
            </DialogHeader>
            <p className="text-sm text-muted-foreground">
              {t("For")} <strong>{selectedChild?.fullName || selectedChild?.firstName}</strong>
            </p>
            {historyLoading ? (
              <div className="flex justify-center py-8">
                <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : transferHistory.length === 0 ? (
              <div className="text-center text-muted-foreground py-8 text-sm">
                {t("No transfer history recorded for this child.")}
              </div>
            ) : (
              <div className="space-y-3">
                {transferHistory.map((tr: any, idx: number) => (
                  <div key={tr.id || idx} className="bg-muted p-3 rounded-lg text-sm space-y-1">
                    <p><strong>{t("Reason")}:</strong> {tr.reason || "-"}</p>
                    <p><strong>{t("New Father ID")}:</strong> {tr.newFatherId || "-"}</p>
                    {tr.transferDate && (
                      <p><strong>{t("Date")}:</strong> {new Date(tr.transferDate).toLocaleString()}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
            <DialogFooter>
              <Button onClick={() => setIsHistoryDialogOpen(false)}>{t("Close")}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t("Delete Child?")}</DialogTitle>
            </DialogHeader>
            <p className="text-muted-foreground">
              {t("Are you sure you want to delete")} <strong>{selectedChild?.firstName} {selectedChild?.lastName}</strong>?
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

        {/* Generate ID Card Dialog */}
        <Dialog open={isIdCardDialogOpen} onOpenChange={setIsIdCardDialogOpen}>
          <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <IdCard className="h-5 w-5 text-primary" /> {t("Generate ID Card")}
              </DialogTitle>
            </DialogHeader>

            {idCardChild && (
              <div className="space-y-4">
                <div>
                  <Label>{t("Member Photo")}</Label>
                  <div className="flex items-center gap-3 mt-1">
                    {idCardPhoto && (
                      <img
                        src={idCardPhoto}
                        alt="preview"
                        className="h-16 w-16 rounded-full object-cover border"
                      />
                    )}
                    <label className="flex items-center gap-2 cursor-pointer text-sm text-primary border border-dashed rounded-md px-3 py-2 hover:bg-muted">
                      <Upload className="h-4 w-4" />
                      {idCardPhoto ? t("Change Photo") : t("Upload Photo")}
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleIdPhotoUpload}
                      />
                    </label>
                  </div>
                </div>

                {/* Printable ID Card */}
                <div className="flex justify-center bg-muted/40 p-4 rounded-lg overflow-x-auto">
                  <div
                    ref={idCardRef}
                    className="w-[560px] shrink-0 bg-white rounded-xl overflow-hidden border shadow-md font-sans"
                  >
                    {/* Header */}
                    <div className="bg-[#4d8f96] text-white px-4 py-3 flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-bold leading-snug">
                          {(idCardChild as any).churchName || t("Church Membership Card")}
                        </p>
                        <p className="text-xs opacity-95 mt-1">
                          {t("Sunday School Members Identification Card")}
                        </p>
                      </div>
                      <img
                        src="/church-logo.png"
                        alt="Church logo"
                        className="h-14 w-14 rounded-full object-cover border-2 border-white shrink-0"
                      />
                    </div>

                    {/* Body */}
                    <div className="relative flex px-4 py-4 gap-4">
                      {/* QR code */}
                      <div className="flex flex-col items-center gap-1 shrink-0">
                        <img
                          src={getIdCardQrUrl(idCardChild)}
                          alt="QR code"
                          className="h-[130px] w-[130px] border"
                        />
                        <p className="text-[10px] text-muted-foreground">
                          {t("Validity")}: {new Date().getFullYear()}
                        </p>
                      </div>

                      {/* Fields */}
                      <div className="flex-1 space-y-1.5 text-sm pr-24">
                        <p>
                          <span className="font-semibold">{t("Name")}: </span>
                          {idCardChild.fullName ||
                            `${idCardChild.firstName || ""} ${idCardChild.middleName || ""} ${idCardChild.lastName || ""}`.trim()}
                        </p>
                        {(idCardChild as any).christianName && (
                          <p>
                            <span className="font-semibold">{t("Christian Name")}: </span>
                            {(idCardChild as any).christianName}
                          </p>
                        )}
                        <p>
                          <span className="font-semibold">{t("Date of Birth")}: </span>
                          {idCardChild.dateOfBirth
                            ? new Date(idCardChild.dateOfBirth).toLocaleDateString()
                            : "-"}
                        </p>
                        <p>
                          <span className="font-semibold">{t("Guardian Name")}: </span>
                          {idCardChild.fatherName || "-"}
                        </p>
                        <p>
                          <span className="font-semibold">{t("Phone")}: </span>
                          {idCardChild.phoneNumber || "-"}
                        </p>
                      </div>

                      {/* Photo, top-right ID number */}
                      <div className="absolute top-4 right-4 flex flex-col items-center gap-1">
                        <p className="text-[10px] font-semibold text-muted-foreground">
                          {t("ID No")}: {(idCardChild as any).sebekaMemberId || idCardChild.id}
                        </p>
                        {idCardPhoto ? (
                          <img
                            src={idCardPhoto}
                            alt="member"
                            className="h-20 w-20 rounded-sm object-cover border-2 border-[#4d8f96]"
                          />
                        ) : (
                          <div className="h-20 w-20 rounded-sm border-2 border-dashed border-[#4d8f96] flex items-center justify-center text-[9px] text-muted-foreground text-center px-1">
                            {t("No photo")}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Footer */}
                    <div className="bg-[#eef3f6] px-4 py-2 text-center border-t">
                      <p className="text-xs font-medium">
                        {t("Contact")}: {(idCardChild as any).contactPhone1 || "-"}
                        {(idCardChild as any).contactPhone2
                          ? ` | ${(idCardChild as any).contactPhone2}`
                          : ""}
                      </p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">
                        {t("This card is the property of the Sunday School and must be returned if lost membership is found.")}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={() => setIsIdCardDialogOpen(false)}>
                {t("Close")}
              </Button>
              <Button variant="outline" onClick={() => handlePrintIdCard?.()}>
                <Download className="h-4 w-4 mr-2" /> {t("Download")}
              </Button>
              <Button onClick={() => handlePrintIdCard?.()}>
                <Printer className="h-4 w-4 mr-2" /> {t("Print")}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
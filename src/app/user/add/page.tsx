"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  User,
  Mail,
  Phone,
  MapPin,
  Loader2,
  Navigation,
  Search,
  Building,
  CheckCircle,
  X,
  Maximize2,
  Upload,
  FileSpreadsheet,
  Download,
  AlertCircle,
  Check,
  Eye,
  Trash2,
  Users,
} from "lucide-react";

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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import DashboardLayout from "@/app/dashboard/layout";
import { createUser, fetchOrganizationsForDropdown, bulkUploadUsers, UserRole } from "@/services/userService";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { GoogleMap, Marker, useJsApiLoader } from "@react-google-maps/api";
import { getGoogleMapsConfig } from "@/lib/googleMapsConfig";
import * as XLSX from "xlsx";

interface Organization {
  id: string;
  name: string;
  code: string;
  isActive: boolean;
}

interface StopLocation {
  name: string;
  address: string;
  latitude: number;
  longitude: number;
}

interface PlaceSuggestion {
  description: string;
  place_id: string;
  structured_formatting: {
    main_text: string;
    secondary_text: string;
  };
}

interface PreviewUser {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  stopName?: string;
  stopAddress?: string;
  latitude?: number;
  longitude?: number;
  isValid: boolean;
  errors?: string[];
}

const mapContainerStyle = {
  width: "100%",
  height: "400px",
  borderRadius: "8px",
};

const defaultCenter = { lat: 9.02497, lng: 38.74689 };

export default function AddUserPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loadingOrgs, setLoadingOrgs] = useState(true);
  const [showMapDialog, setShowMapDialog] = useState(false);
  const [selectedPosition, setSelectedPosition] = useState<{ lat: number; lng: number; address?: string } | null>(null);
  const [mapCenter, setMapCenter] = useState(defaultCenter);
  const [addressSearch, setAddressSearch] = useState("");
  const [addressSuggestions, setAddressSuggestions] = useState<PlaceSuggestion[]>([]);
  const [showAddressSuggestions, setShowAddressSuggestions] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [mapSearchMode, setMapSearchMode] = useState<"map" | "address">("address");
  const [activeTab, setActiveTab] = useState<"single" | "bulk">("single");
  
  // Bulk upload states
  const [bulkFile, setBulkFile] = useState<File | null>(null);
  const [bulkOrganizationId, setBulkOrganizationId] = useState("");
  const [bulkRole, setBulkRole] = useState<UserRole>("passenger");
  const [bulkDefaultPassword, setBulkDefaultPassword] = useState("Certeficate-dashboard@123");
  const [bulkUploadProgress, setBulkUploadProgress] = useState(0);
  const [isBulkUploading, setIsBulkUploading] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewData, setPreviewData] = useState<PreviewUser[]>([]);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const autocompleteServiceRef = useRef<google.maps.places.AutocompleteService | null>(null);
  const placesServiceRef = useRef<google.maps.places.PlacesService | null>(null);
  const geocoderRef = useRef<google.maps.Geocoder | null>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const addressInputRef = useRef<HTMLInputElement>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const { t } = useTranslation();

  const { googleMapsApiKey, libraries } = getGoogleMapsConfig();
  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey,
    libraries,
  });

  const [formData, setFormData] = useState({
    organization_id: "",
    email: "",
    phone: "",
    first_name: "",
    last_name: "",
    password: "Certeficate-dashboard@123",
    role: "passenger" as string,
    stop: {
      name: "",
      address: "",
      latitude: 9.02497,
      longitude: 38.74689,
    } as StopLocation,
  });

  // Load organizations for dropdown
  useEffect(() => {
    const loadOrganizations = async () => {
      try {
        const orgs = await fetchOrganizationsForDropdown();
        setOrganizations(orgs.filter(org => org.isActive));
        if (orgs.length > 0) {
          setFormData(prev => ({ ...prev, organization_id: orgs[0].id }));
          setBulkOrganizationId(orgs[0].id);
        }
      } catch (error) {
        console.error("Failed to load organizations:", error);
        toast.error("Failed to load organizations");
      } finally {
        setLoadingOrgs(false);
      }
    };
    loadOrganizations();
  }, []);

  // Initialize Google Maps services
  useEffect(() => {
    if (isLoaded && window.google) {
      autocompleteServiceRef.current = new google.maps.places.AutocompleteService();
      placesServiceRef.current = new google.maps.places.PlacesService(document.createElement('div'));
      geocoderRef.current = new google.maps.Geocoder();
    }
  }, [isLoaded]);

  // Handle click outside suggestions
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(event.target as Node)) {
        setShowAddressSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch place suggestions
  const fetchPlaceSuggestions = useCallback(async (input: string): Promise<PlaceSuggestion[]> => {
    if (!input.trim() || !autocompleteServiceRef.current) {
      return [];
    }

    return new Promise((resolve) => {
      autocompleteServiceRef.current!.getPlacePredictions(
        {
          input: input,
          componentRestrictions: { country: "et" },
          types: ["geocode"],
        },
        (predictions, status) => {
          if (status === google.maps.places.PlacesServiceStatus.OK && predictions) {
            resolve(predictions);
          } else {
            resolve([]);
          }
        }
      );
    });
  }, []);

  // Handle address selection
  const handleAddressSelect = async (placeId: string, description: string) => {
    if (!placesServiceRef.current) {
      toast.error("Places service not ready");
      return;
    }

    setIsSearching(true);

    placesServiceRef.current.getDetails(
      {
        placeId: placeId,
        fields: ['geometry', 'formatted_address', 'place_id', 'name'],
      },
      (place, status) => {
        if (status === google.maps.places.PlacesServiceStatus.OK && place && place.geometry?.location) {
          const location = place.geometry.location;
          const lat = location.lat();
          const lng = location.lng();

          const locationData = {
            lat: lat,
            lng: lng,
            address: place.formatted_address || description,
          };

          setSelectedPosition(locationData);
          
          setFormData(prev => ({ 
            ...prev, 
            stop: {
              ...prev.stop,
              address: place.formatted_address || description,
              latitude: Number(lat.toFixed(6)),
              longitude: Number(lng.toFixed(6)),
            }
          }));
          
          setAddressSearch(description);
          setShowAddressSuggestions(false);
          setMapCenter({ lat, lng });
          toast.success("Location selected!");
        } else {
          toast.error("Could not find location details");
        }
        setIsSearching(false);
      }
    );
  };

  // Handle address search
  const handleAddressSearchChange = async (value: string) => {
    setAddressSearch(value);
    if (value.trim()) {
      const suggestions = await fetchPlaceSuggestions(value);
      setAddressSuggestions(suggestions);
      setShowAddressSuggestions(true);
    } else {
      setAddressSuggestions([]);
      setShowAddressSuggestions(false);
    }
  };

  // Handle map click
  const handleMapClick = async (e: google.maps.MapMouseEvent) => {
    if (!e.latLng) return;
    
    const lat = e.latLng.lat();
    const lng = e.latLng.lng();
    
    setSelectedPosition({ lat, lng });
    setMapCenter({ lat, lng });
    
    setFormData(prev => ({
      ...prev,
      stop: {
        ...prev.stop,
        latitude: Number(lat.toFixed(6)),
        longitude: Number(lng.toFixed(6)),
      }
    }));
    
    // Reverse geocode to get address
    if (geocoderRef.current) {
      geocoderRef.current.geocode(
        { location: { lat, lng } },
        (results, status) => {
          if (status === "OK" && results?.[0]) {
            const address = results[0].formatted_address;
            setFormData(prev => ({ 
              ...prev, 
              stop: { ...prev.stop, address }
            }));
            setAddressSearch(address);
            setSelectedPosition(prev => prev ? { ...prev, address } : { lat, lng, address });
          }
        }
      );
    }
    
    toast.success("Location selected from map");
  };

  // Handle use current location
  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported");
      return;
    }

    toast.info("Getting your location...");

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        
        setSelectedPosition({ lat, lng });
        setMapCenter({ lat, lng });
        
        setFormData(prev => ({
          ...prev,
          stop: {
            ...prev.stop,
            latitude: Number(lat.toFixed(6)),
            longitude: Number(lng.toFixed(6)),
          }
        }));
        
        // Reverse geocode
        if (geocoderRef.current) {
          geocoderRef.current.geocode(
            { location: { lat, lng } },
            (results, status) => {
              if (status === "OK" && results?.[0]) {
                const address = results[0].formatted_address;
                setFormData(prev => ({ 
                  ...prev, 
                  stop: { ...prev.stop, address }
                }));
                setAddressSearch(address);
                setSelectedPosition(prev => prev ? { ...prev, address } : { lat, lng, address });
              }
            }
          );
        }
        
        toast.success("Current location set");
      },
      (error) => {
        toast.error("Unable to get your location");
      }
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const missing = [];
    if (!formData.organization_id) missing.push("Organization");
    if (!formData.first_name) missing.push("First Name");
    if (!formData.last_name) missing.push("Last Name");
    if (!formData.email) missing.push("Email");
    if (!formData.phone) missing.push("Phone");
    if (!formData.password) missing.push("Password");

    if (missing.length > 0) {
      toast.error(`Please fill: ${missing.join(", ")}`);
      return;
    }

    // Validate stop location if role is PASSENGER
    if ( (!formData.stop.address || !formData.stop.name)) {
      toast.error("Please select a stop location and provide stop name for passenger");
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        organization_id: formData.organization_id,
        email: formData.email,
        password: formData.password,
        firstName: formData.first_name,
        lastName: formData.last_name,
        phone: formData.phone,
        role: formData.role as any,
        stop: formData.stop,
      };

      await createUser(payload);
      toast.success("User created successfully");
      router.push("/user");
    } catch (err: any) {
      toast.error(err.message || "Failed to create user");
    } finally {
      setIsSubmitting(false);
    }
  };

  const parseExcelFile = (file: File): Promise<any[]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
          const jsonData = XLSX.utils.sheet_to_json(firstSheet);
          resolve(jsonData);
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = (error) => reject(error);
      reader.readAsArrayBuffer(file);
    });
  };

  const extractAndPreview = async () => {
    if (!bulkFile) {
      toast.error("Please select a file first");
      return;
    }

    setIsLoadingPreview(true);
    try {
      const parsedData = await parseExcelFile(bulkFile);
      
      const previewUsers: PreviewUser[] = parsedData.map((row: any, index: number) => {
        const errors: string[] = [];
        
        // Try different column name variations
        const firstName = row['First Name'] || row['firstName'] || row['first_name'] || '';
        const lastName = row['Last Name'] || row['lastName'] || row['last_name'] || '';
        const email = row['Email'] || row['email'] || '';
        const phone = row['Phone'] || row['phone'] || '';
        const stopName = row['Stop Name'] || row['stopName'] || row['stop_name'] || '';
        const stopAddress = row['Stop Address'] || row['stopAddress'] || row['stop_address'] || '';
        const latitude = row['Latitude'] || row['latitude'] || null;
        const longitude = row['Longitude'] || row['longitude'] || null;
        
        // Validation
        if (!firstName) errors.push('First Name is required');
        if (!lastName) errors.push('Last Name is required');
        if (!email) errors.push('Email is required');
        if (!phone) errors.push('Phone is required');
        if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.push('Invalid email format');
        
        return {
          firstName,
          lastName,
          email,
          phone,
          stopName,
          stopAddress,
          latitude: latitude ? parseFloat(latitude) : undefined,
          longitude: longitude ? parseFloat(longitude) : undefined,
          isValid: errors.length === 0,
          errors: errors.length > 0 ? errors : undefined,
        };
      });
      
      setPreviewData(previewUsers);
      setIsPreviewOpen(true);
    } catch (error) {
      console.error("Parse error:", error);
      toast.error("Failed to parse Excel file. Please check the format.");
    } finally {
      setIsLoadingPreview(false);
    }
  };

  const handleBulkUpload = async () => {
    if (!bulkFile) {
      toast.error("Please select an Excel file to upload");
      return;
    }
    if (!bulkOrganizationId) {
      toast.error("Please select an organization");
      return;
    }
    if (!bulkRole) {
      toast.error("Please select a role");
      return;
    }

    const validUsers = previewData.filter(user => user.isValid);
    if (validUsers.length === 0) {
      toast.error("No valid users to upload. Please check the preview.");
      return;
    }

    setIsBulkUploading(true);
    setBulkUploadProgress(0);

    const progressInterval = setInterval(() => {
      setBulkUploadProgress(prev => Math.min(prev + 10, 90));
    }, 500);

    try {
      await bulkUploadUsers({
        file: bulkFile,
        organization_id: bulkOrganizationId,
        role: bulkRole,
        default_password: bulkDefaultPassword,
      });
      
      clearInterval(progressInterval);
      setBulkUploadProgress(100);
      
      toast.success(`Successfully uploaded ${validUsers.length} users!`);
      
      setTimeout(() => {
        setBulkFile(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
        setBulkUploadProgress(0);
        setPreviewData([]);
        router.push("/user");
      }, 1500);
    } catch (err: any) {
      clearInterval(progressInterval);
      setBulkUploadProgress(0);
      toast.error(err.message || "Failed to upload bulk users");
    } finally {
      setIsBulkUploading(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const validTypes = [
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-excel'
      ];
      if (!validTypes.includes(file.type) && !file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
        toast.error("Please upload a valid Excel file (.xlsx or .xls)");
        return;
      }
      setBulkFile(file);
    }
  };

  const downloadTemplate = () => {
    const headers = ['First Name', 'Last Name', 'Email', 'Phone', 'Stop Name', 'Stop Address', 'Latitude', 'Longitude'];
    const sampleData = [
      ['John', 'Doe', 'john.doe@example.com', '+251911234567', 'Bole Medhanialem', 'Bole Medhanialem, Addis Ababa', '9.0051', '38.7637'],
      ['Jane', 'Smith', 'jane.smith@example.com', '+251922345678', 'Mexico Square', 'Mexico Square, Addis Ababa', '9.0305', '38.7478']
    ];
    
    const wsData = [headers, ...sampleData];
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'User Template');
    
    XLSX.writeFile(wb, 'user_upload_template.xlsx');
    
    toast.info("Excel template downloaded. Please follow the format.");
  };

  const onMapLoad = (map: google.maps.Map) => {
    mapRef.current = map;
  };

  const SuggestionList = ({ 
    suggestions, 
    onSelect 
  }: { 
    suggestions: PlaceSuggestion[]; 
    onSelect: (placeId: string, description: string) => void;
  }) => (
    <div 
      ref={suggestionsRef}
      className="absolute z-50 mt-1 w-full rounded-md shadow-lg max-h-60 overflow-y-auto bg-white border"
    >
      {suggestions.map((suggestion) => (
        <div
          key={suggestion.place_id}
          className="px-4 py-3 cursor-pointer border-b last:border-b-0 hover:bg-gray-50 transition-colors"
          onClick={() => onSelect(suggestion.place_id, suggestion.description)}
        >
          <div className="flex items-start gap-2">
            <Navigation className="h-4 w-4 mt-0.5 flex-shrink-0 text-primary" />
            <div className="flex-1">
              <div className="font-medium text-sm text-gray-900">
                {suggestion.structured_formatting.main_text}
              </div>
              <div className="text-xs text-gray-500 mt-0.5">
                {suggestion.structured_formatting.secondary_text}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  const validUsersCount = previewData.filter(u => u.isValid).length;
  const invalidUsersCount = previewData.filter(u => !u.isValid).length;

  if (!googleMapsApiKey) {
    return (
      <DashboardLayout>
        <div className="p-6">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
            Google Maps API key is missing. Please check your environment variables.
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-5xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <Button
              variant="ghost"
              onClick={() => router.push("/user")}
              className="mb-6 text-gray-600 hover:text-primary"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              {t("Back")}
            </Button>
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">
                {t("Add Employee")}
              </h1>
              <p className="text-gray-500 mt-1">
                {t("Create a new user account or bulk upload users")}
              </p>
            </div>
          </div>

          {/* Tabs */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "single" | "bulk")} className="w-full">
              <TabsList className="grid w-full grid-cols-2 rounded-t-lg rounded-b-none border-b">
                <TabsTrigger value="single" className="py-3">
                  <User className="h-4 w-4 mr-2" />
                  Single User
                </TabsTrigger>
                <TabsTrigger value="bulk" className="py-3">
                  <Upload className="h-4 w-4 mr-2" />
                  User Bulk Upload (Excel)
                </TabsTrigger>
              </TabsList>

              <TabsContent value="single" className="p-6">
                <form onSubmit={handleSubmit}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-gray-700">
                        Organization <span className="text-red-500">*</span>
                      </Label>
                      <div className="flex items-center gap-3">
                        <Building className="h-5 w-5 text-primary" />
                        <Select
                          value={formData.organization_id}
                          onValueChange={(v) => setFormData({ ...formData, organization_id: v })}
                          disabled={loadingOrgs}
                        >
                          <SelectTrigger className="flex-1">
                            <SelectValue placeholder="Select organization" />
                          </SelectTrigger>
                          <SelectContent>
                            {organizations.map((org) => (
                              <SelectItem key={org.id} value={org.id}>
                                {org.name} ({org.code})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-gray-700">
                        Role <span className="text-red-500">*</span>
                      </Label>
                      <Select
                        value={formData.role}
                        onValueChange={(v) => setFormData({ ...formData, role: v })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select role" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="passenger">Passenger</SelectItem>
                          <SelectItem value="driver">Driver</SelectItem>
                          <SelectItem value="admin">Organization Admin</SelectItem>
                          <SelectItem value="super_admin">Super Admin</SelectItem>
                        
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="firstName" className="text-sm font-medium text-gray-700">
                        First Name <span className="text-red-500">*</span>
                      </Label>
                      <div className="flex items-center gap-3">
                        <User className="h-5 w-5 text-primary" />
                        <Input
                          id="firstName"
                          placeholder="First Name"
                          value={formData.first_name}
                          onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                          className="flex-1"
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="lastName" className="text-sm font-medium text-gray-700">
                        Last Name <span className="text-red-500">*</span>
                      </Label>
                      <div className="flex items-center gap-3">
                        <User className="h-5 w-5 text-primary" />
                        <Input
                          id="lastName"
                          placeholder="Last Name"
                          value={formData.last_name}
                          onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                          className="flex-1"
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                        Email <span className="text-red-500">*</span>
                      </Label>
                      <div className="flex items-center gap-3">
                        <Mail className="h-5 w-5 text-primary" />
                        <Input
                          id="email"
                          type="email"
                          placeholder="name@example.com"
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          className="flex-1"
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="phone" className="text-sm font-medium text-gray-700">
                        Phone Number <span className="text-red-500">*</span>
                      </Label>
                      <div className="flex items-center gap-3">
                        <Phone className="h-5 w-5 text-primary" />
                        <Input
                          id="phone"
                          placeholder="+251 911 234 567"
                          value={formData.phone}
                          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                          className="flex-1"
                          required
                        />
                      </div>
                    </div>

                 
                      <>
                        <div className="space-y-2">
                          <Label className="text-sm font-medium text-gray-700">
                            Stop Name <span className="text-red-500">*</span>
                          </Label>
                          <div className="flex items-center gap-3">
                            <MapPin className="h-5 w-5 text-primary" />
                            <Input
                              placeholder="e.g., Bole Medhanialem"
                              value={formData.stop.name}
                              onChange={(e) => setFormData({ 
                                ...formData, 
                                stop: { ...formData.stop, name: e.target.value }
                              })}
                              className="flex-1"
                              required
                            />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label className="text-sm font-medium text-gray-700">
                            Stop Location <span className="text-red-500">*</span>
                          </Label>
                          <div className="flex items-center gap-3">
                            <MapPin className="h-5 w-5 text-primary" />
                            <Input
                              placeholder="Select location on map"
                              value={formData.stop.address || "Click to select location"}
                              readOnly
                              className="flex-1 cursor-pointer"
                              onClick={() => setShowMapDialog(true)}
                            />
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => setShowMapDialog(true)}
                              className="border-primary text-primary hover:bg-primary/10"
                            >
                              <MapPin className="h-4 w-4" />
                            </Button>
                          </div>
                          {formData.stop.latitude && formData.stop.longitude && (
                            <p className="text-xs text-gray-500 mt-1">
                              Lat: {formData.stop.latitude.toFixed(6)}, Lng: {formData.stop.longitude.toFixed(6)}
                            </p>
                          )}
                        </div>
                      </>
                    
                  </div>

                  <div className="flex items-center justify-end gap-3 mt-8 pt-6 border-t border-gray-200">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => router.push("/user")}
                      className="px-6"
                    >
                      {t("Cancel")}
                    </Button>
                    <Button
                      type="submit"
                      disabled={isSubmitting}
                      className="px-8 bg-primary hover:bg-primary/90 text-white"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          {t("Adding...")}
                        </>
                      ) : (
                        t("Add Employee")
                      )}
                    </Button>
                  </div>
                </form>
              </TabsContent>

              <TabsContent value="bulk" className="p-6">
                <div className="space-y-6">
                  <Alert>
                    <FileSpreadsheet className="h-4 w-4" />
                    <AlertTitle>Bulk Upload Instructions</AlertTitle>
                    <AlertDescription>
                      Upload an Excel file (.xlsx or .xls) with the following columns:
                      <ul className="list-disc list-inside mt-2 space-y-1 text-sm">
                        <li><strong>First Name</strong> - Required</li>
                        <li><strong>Last Name</strong> - Required</li>
                        <li><strong>Email</strong> - Required</li>
                        <li><strong>Phone</strong> - Required</li>
                        <li><strong>Stop Name</strong> - Required</li>
                        <li><strong>Stop Address</strong> - Required</li>
                        <li><strong>Latitude</strong> - Required</li>
                        <li><strong>Longitude</strong> - Required</li>
                      </ul>
                    </AlertDescription>
                  </Alert>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-gray-700">
                        Organization <span className="text-red-500">*</span>
                      </Label>
                      <Select
                        value={bulkOrganizationId}
                        onValueChange={setBulkOrganizationId}
                        disabled={loadingOrgs}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select organization" />
                        </SelectTrigger>
                        <SelectContent>
                          {organizations.map((org) => (
                            <SelectItem key={org.id} value={org.id}>
                              {org.name} ({org.code})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-gray-700">
                        Default Role <span className="text-red-500">*</span>
                      </Label>
                      <Select
                        value={bulkRole}
                        onValueChange={(v) => setBulkRole(v as UserRole)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select role" />
                        </SelectTrigger>
                        <SelectContent>
                         <SelectItem value="passenger">Passenger</SelectItem>
                          <SelectItem value="driver">Driver</SelectItem>
                          <SelectItem value="admin">Organization Admin</SelectItem>
                          <SelectItem value="super_admin">Super Admin</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-700">
                      Default Password <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      type="text"
                      value={bulkDefaultPassword}
                      onChange={(e) => setBulkDefaultPassword(e.target.value)}
                      placeholder="Default password for all users"
                    />
                    <p className="text-xs text-gray-500">This password will be set for all users created via bulk upload</p>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-700">
                      Excel File <span className="text-red-500">*</span>
                    </Label>
                    <div className="flex gap-3">
                      <div className="flex-1">
                        <Input
                          ref={fileInputRef}
                          type="file"
                          accept=".xlsx,.xls"
                          onChange={handleFileChange}
                          className="cursor-pointer"
                        />
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={downloadTemplate}
                        className="gap-2"
                      >
                        <Download className="h-4 w-4" />
                        Download Template
                      </Button>
                    </div>
                    {bulkFile && (
                      <div className="flex items-center justify-between mt-2">
                        <div className="flex items-center gap-2 text-sm text-green-600">
                          <Check className="h-4 w-4" />
                          Selected: {bulkFile.name}
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={extractAndPreview}
                          disabled={isLoadingPreview}
                          className="gap-2"
                        >
                          {isLoadingPreview ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                          Preview Data
                        </Button>
                      </div>
                    )}
                  </div>

                  {isBulkUploading && (
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Uploading...</span>
                        <span>{bulkUploadProgress}%</span>
                      </div>
                      <Progress value={bulkUploadProgress} className="h-2" />
                    </div>
                  )}

                  <div className="flex items-center justify-end gap-3 pt-6 border-t border-gray-200">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => router.push("/user")}
                      className="px-6"
                    >
                      {t("Cancel")}
                    </Button>
                    <Button
                      type="button"
                      onClick={handleBulkUpload}
                      disabled={isBulkUploading || !bulkFile || !bulkOrganizationId}
                      className="px-8 bg-primary hover:bg-primary/90 text-white"
                    >
                      {isBulkUploading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Uploading...
                        </>
                      ) : (
                        <>
                          <Upload className="mr-2 h-4 w-4" />
                          Upload & Create Users
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>

      {/* Preview Modal */}
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-w-5xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="text-2xl flex items-center gap-2">
              <FileSpreadsheet className="h-5 w-5 text-primary" />
              Preview Extracted Data
            </DialogTitle>
            <DialogDescription>
              Review the data extracted from your Excel file before uploading
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex items-center justify-between gap-4 py-3 border-b">
            <div className="flex gap-4">
              <Badge variant="default" className="bg-green-100 text-green-800">
                Valid: {validUsersCount}
              </Badge>
              <Badge variant="default" className="bg-red-100 text-red-800">
                Invalid: {invalidUsersCount}
              </Badge>
              <Badge variant="outline">
                Total: {previewData.length}
              </Badge>
            </div>
            {invalidUsersCount > 0 && (
              <Alert className="mb-0 py-2 bg-yellow-50 border-yellow-200">
                <AlertCircle className="h-4 w-4 text-yellow-600" />
                <AlertDescription className="text-yellow-700 text-sm">
                  Some rows have validation errors. They will be skipped during upload.
                </AlertDescription>
              </Alert>
            )}
          </div>

          <ScrollArea className="flex-1 -mr-6 pr-6">
            <div className="py-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">#</TableHead>
                    <TableHead>First Name</TableHead>
                    <TableHead>Last Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Stop Name</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {previewData.map((user, index) => (
                    <TableRow key={index} className={!user.isValid ? "bg-red-50" : ""}>
                      <TableCell className="font-mono text-xs">{index + 1}</TableCell>
                      <TableCell className="font-medium">{user.firstName || "-"}</TableCell>
                      <TableCell>{user.lastName || "-"}</TableCell>
                      <TableCell>{user.email || "-"}</TableCell>
                      <TableCell>{user.phone || "-"}</TableCell>
                      <TableCell>{user.stopName || "-"}</TableCell>
                      <TableCell>
                        {user.isValid ? (
                          <Badge className="bg-green-100 text-green-800">Valid</Badge>
                        ) : (
                          <Badge className="bg-red-100 text-red-800">Invalid</Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {invalidUsersCount > 0 && (
                <div className="mt-4 space-y-2">
                  <Label className="font-semibold">Validation Errors:</Label>
                  {previewData.map((user, index) => (
                    user.errors && user.errors.length > 0 && (
                      <div key={`error-${index}`} className="text-sm text-red-600 p-2 bg-red-50 rounded">
                        <strong>Row {index + 1}:</strong> {user.errors.join(", ")}
                      </div>
                    )
                  ))}
                </div>
              )}
            </div>
          </ScrollArea>

          <DialogFooter className="pt-4 border-t">
            <Button variant="outline" onClick={() => setIsPreviewOpen(false)}>
              Close
            </Button>
            <Button 
              onClick={() => {
                setIsPreviewOpen(false);
                handleBulkUpload();
              }}
              disabled={validUsersCount === 0}
              className="bg-primary text-white"
            >
              Upload Valid Users ({validUsersCount})
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Location Map Dialog */}
      <Dialog open={showMapDialog} onOpenChange={setShowMapDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl">Select Stop Location</DialogTitle>
            <DialogDescription>
              Search for a place or click on the map to select the stop location
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="flex gap-2">
              <Button
                type="button"
                variant={mapSearchMode === "address" ? "default" : "outline"}
                size="sm"
                onClick={() => setMapSearchMode("address")}
                className="flex-1"
              >
                <Search className="h-4 w-4 mr-2" />
                Search Address
              </Button>
              <Button
                type="button"
                variant={mapSearchMode === "map" ? "default" : "outline"}
                size="sm"
                onClick={() => setMapSearchMode("map")}
                className="flex-1"
              >
                <MapPin className="h-4 w-4 mr-2" />
                Select on Map
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleUseCurrentLocation}
                className="flex-1"
              >
                <Navigation className="h-4 w-4 mr-2" />
                My Location
              </Button>
            </div>

            {mapSearchMode === "address" && (
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  ref={addressInputRef}
                  placeholder="Search for address in Ethiopia..."
                  value={addressSearch}
                  onChange={(e) => handleAddressSearchChange(e.target.value)}
                  className="pl-9"
                />
                {isSearching && (
                  <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 animate-spin text-primary" />
                )}
                {showAddressSuggestions && addressSuggestions.length > 0 && (
                  <SuggestionList
                    suggestions={addressSuggestions}
                    onSelect={handleAddressSelect}
                  />
                )}
              </div>
            )}

            {formData.stop.address && (
              <div className="p-3 bg-green-50 rounded-lg flex items-start gap-2">
                <CheckCircle className="h-4 w-4 mt-0.5 flex-shrink-0 text-green-600" />
                <div className="flex-1">
                  <p className="text-xs text-green-700">Selected Location:</p>
                  <p className="text-sm font-medium text-green-900">{formData.stop.address}</p>
                  <p className="text-xs text-green-600 font-mono mt-1">
                    {formData.stop.latitude.toFixed(6)}, {formData.stop.longitude.toFixed(6)}
                  </p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setFormData(prev => ({ 
                      ...prev, 
                      stop: { ...prev.stop, address: "" }
                    }));
                    setAddressSearch("");
                    setSelectedPosition(null);
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}

            {mapSearchMode === "map" && isLoaded && (
              <div className="space-y-2">
                <Label className="text-sm font-semibold">Click on map to select location</Label>
                <div className="rounded-lg overflow-hidden border">
                  <GoogleMap
                    mapContainerStyle={mapContainerStyle}
                    center={mapCenter}
                    zoom={14}
                    onLoad={onMapLoad}
                    onClick={handleMapClick}
                    options={{
                      streetViewControl: true,
                      mapTypeControl: true,
                      fullscreenControl: true,
                      zoomControl: true,
                    }}
                  >
                    {selectedPosition && (
                      <Marker
                        position={{ lat: selectedPosition.lat, lng: selectedPosition.lng }}
                        draggable
                        onDragEnd={(e) => {
                          if (e.latLng) {
                            const lat = e.latLng.lat();
                            const lng = e.latLng.lng();
                            setSelectedPosition({ lat, lng });
                            setFormData(prev => ({
                              ...prev,
                              stop: {
                                ...prev.stop,
                                latitude: lat,
                                longitude: lng,
                              }
                            }));
                          }
                        }}
                      />
                    )}
                  </GoogleMap>
                </div>
                <p className="text-xs text-muted-foreground">
                  Click on the map or drag the marker to select location
                </p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowMapDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => setShowMapDialog(false)}
              className="bg-primary hover:bg-primary/90 text-white"
            >
              Confirm Location
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
import { useState } from "react";
import { useQuery, useMutation, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import axios from "axios";
import { SYS_VAR } from "@/constants/const";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Pagination,
    PaginationContent,
    PaginationEllipsis,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
} from "@/components/ui/pagination";
import {
    MonitorSmartphone,
    Plus,
    X,
    Loader,
    AlertCircle,
    Smartphone,

    Sparkles,
    Tag,
} from "lucide-react";
import toast from "react-hot-toast";

// --- Types ---
export interface OrphanDevice {
    _id: string;
    brand?: string;
    model?: string;
    category?: string;
    price?: string;
    specifications?: string[];
    imageUrl?: string;
    productUrl?: string;
    scrapedAt?: string;
    smc?: string;
    detailedSpecifications?: {
        title?: string;
        price?: string;
        display?: string;
        variants?: { name?: string; price?: string }[];
        os?: string;
        processor?: string;
        chipset?: string;
        battery?: string;
        frontCamera?: string;
        backCamera?: string;
        connectivity?: { type?: string; value?: string }[];
    };
    modelCodes?: string[];
}

export interface PaginationInfo {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
}

export interface GetOrphanDevicesResponse {
    result: string;
    data: OrphanDevice[];
    pagination: PaginationInfo;
}

// --- Fetcher API Function ---
const fetchOrphanDevices = async (page: number, limit: number) => {
    const { data } = await axios.get<GetOrphanDevicesResponse>(
        `${SYS_VAR.BACKEND_URL_V2}/device-data/get-devices-wtmc`,
        {
            params: { page, limit },
            withCredentials: true,
        }
    );

    return data;
};

// --- Main Page Component ---
const OrphanModels = () => {
    const [page, setPage] = useState<number>(1);
    const [limit, setLimit] = useState<number>(20);
    const [searchText, setSearchText] = useState<string>("");
    const [selectedDevice, setSelectedDevice] = useState<OrphanDevice | null>(null);
    const [isFormOpen, setIsFormOpen] = useState<boolean>(false);
    const [newModelCode, setNewModelCode] = useState<string>("");
    const [modelCodesList, setModelCodesList] = useState<string[]>([]);

    const queryClient = useQueryClient();

    // --- React Query for Fetching Orphan Models ---
    const {
        data,
        isLoading,
        isError,
        error,
        isFetching,
    } = useQuery({
        queryKey: ["orphan-devices", page, limit],
        queryFn: () => fetchOrphanDevices(page, limit),
        placeholderData: keepPreviousData,
    });

    // --- React Query Mutation for Updating Model Codes ---
    const updateModelCodesMutation = useMutation({
        mutationFn: async ({
            deviceId,
            modelCodes,
        }: {
            deviceId: string;
            modelCodes: string[];
        }) => {
            const { data } = await axios.put<{
                result: string;
                message?: string;
                data?: any;
            }>(
                `${SYS_VAR.BACKEND_URL_V2}/device-data/devices/update-model-codes`,
                { deviceId, modelCodes },
                { withCredentials: true }
            );

            if (data?.result === "error") {
                throw new Error(data?.message || "Failed to update model codes");
            }

            return data;
        },
        onSuccess: () => {
            toast.success("Model codes updated successfully!");
            // Invalidate orphan devices query so list auto-updates
            queryClient.invalidateQueries({ queryKey: ["orphan-devices"] });
            setIsFormOpen(false);
            setSelectedDevice(null);
            setModelCodesList([]);
            setNewModelCode("");
        },
        onError: (err: any) => {
            const errorMsg =
                err?.response?.data?.message || err?.message || "Failed to update model codes";
            toast.error(errorMsg);
        },
    });

    // Open modal for adding model code
    const handleOpenAddModal = (device: OrphanDevice) => {
        setSelectedDevice(device);
        setModelCodesList(device.modelCodes || []);
        setNewModelCode("");
        setIsFormOpen(true);
    };

    // Add tag to list
    const handleAddModelCode = () => {
        const trimmed = newModelCode.trim();
        if (!trimmed) {
            toast.error("Please enter a valid model code");
            return;
        }
        if (modelCodesList.includes(trimmed)) {
            toast.error("This model code is already in the list");
            return;
        }
        setModelCodesList([...modelCodesList, trimmed]);
        setNewModelCode("");
    };

    // Remove tag from list
    const handleRemoveModelCode = (code: string) => {
        setModelCodesList(modelCodesList.filter((c) => c !== code));
    };

    // Submit model codes to API
    const handleSaveModelCodes = () => {
        if (!selectedDevice) return;
        if (modelCodesList.length === 0) {
            toast.error("Please add at least one model code before saving");
            return;
        }

        updateModelCodesMutation.mutate({
            deviceId: selectedDevice._id,
            modelCodes: modelCodesList,
        });
    };

    // Filter devices locally by searchText (brand, model, category, smc)
    const rawDevices = data?.data || [];
    const filteredDevices = rawDevices.filter((dev) => {
        if (!searchText.trim()) return true;
        const query = searchText.toLowerCase();
        const brand = (dev.brand || "").toLowerCase();
        const model = (dev.model || "").toLowerCase();
        const category = (dev.category || "").toLowerCase();
        const smc = (dev.smc || "").toLowerCase();
        return (
            brand.includes(query) ||
            model.includes(query) ||
            category.includes(query) ||
            smc.includes(query)
        );
    });

    const pagination = data?.pagination;
    const totalPages = pagination?.totalPages || 1;
    const totalItems = pagination?.total || 0;

    // Render Page Numbers for Shadcn Pagination
    const renderPaginationItems = () => {
        if (totalPages <= 1) return null;
        const items = [];
        const maxVisible = 5;
        let startPage = Math.max(1, page - 2);
        let endPage = Math.min(totalPages, startPage + maxVisible - 1);

        if (endPage - startPage + 1 < maxVisible) {
            startPage = Math.max(1, endPage - maxVisible + 1);
        }

        if (startPage > 1) {
            items.push(
                <PaginationItem key={1}>
                    <PaginationLink
                        onClick={(e) => {
                            e.preventDefault();
                            setPage(1);
                        }}
                        isActive={page === 1}
                        className="cursor-pointer"
                    >
                        1
                    </PaginationLink>
                </PaginationItem>
            );
            if (startPage > 2) {
                items.push(
                    <PaginationItem key="start-ellipsis">
                        <PaginationEllipsis />
                    </PaginationItem>
                );
            }
        }

        for (let p = startPage; p <= endPage; p++) {
            items.push(
                <PaginationItem key={p}>
                    <PaginationLink
                        onClick={(e) => {
                            e.preventDefault();
                            setPage(p);
                        }}
                        isActive={page === p}
                        className="cursor-pointer"
                    >
                        {p}
                    </PaginationLink>
                </PaginationItem>
            );
        }

        if (endPage < totalPages) {
            if (endPage < totalPages - 1) {
                items.push(
                    <PaginationItem key="end-ellipsis">
                        <PaginationEllipsis />
                    </PaginationItem>
                );
            }
            items.push(
                <PaginationItem key={totalPages}>
                    <PaginationLink
                        onClick={(e) => {
                            e.preventDefault();
                            setPage(totalPages);
                        }}
                        isActive={page === totalPages}
                        className="cursor-pointer"
                    >
                        {totalPages}
                    </PaginationLink>
                </PaginationItem>
            );
        }

        return items;
    };

    return (
        <div className="px-6 py-6 max-w-7xl mx-auto space-y-6">
            {/* Header Section */}
            <div className="flex flex-wrap items-center justify-between gap-4 mb-20">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-linear-to-br from-[#9810FA] to-[#8200DB] flex items-center justify-center shadow-md">
                        <MonitorSmartphone className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h1 className="text-2xl font-bold text-gray-900">Orphan Models</h1>

                        </div>
                        <p className="text-slate-500 text-sm">
                            Devices missing model codes. Assign model codes to categorize them properly.
                        </p>
                    </div>
                </div>

                {isFetching && !isLoading && (
                    <div className="flex items-center gap-2 text-xs font-medium text-purple-600 bg-purple-50 px-3 py-1.5 rounded-full border border-purple-200">
                        <Loader className="w-3.5 h-3.5 animate-spin" /> Updating list...
                    </div>
                )}
            </div>


            {/* --- Pagination Right Below Searchbar --- */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-xl border border-gray-200 shadow-xs">
                <div className="flex items-center gap-3 text-sm text-gray-600">
                    <span>
                        Showing{" "}
                        <strong className="text-gray-900">
                            {totalItems === 0 ? 0 : (page - 1) * limit + 1}
                        </strong>{" "}
                        to{" "}
                        <strong className="text-gray-900">
                            {Math.min(page * limit, totalItems)}
                        </strong>{" "}
                        of <strong className="text-gray-900">{totalItems}</strong> models
                    </span>

                    <div className="flex items-center gap-1.5 ml-2">
                        <span className="text-xs text-gray-500">Per page:</span>
                        <select
                            value={limit}
                            onChange={(e) => {
                                setLimit(Number(e.target.value));
                                setPage(1);
                            }}
                            className="text-xs border border-gray-300 rounded-md px-2 py-1 bg-white font-medium focus:outline-hidden focus:ring-2 focus:ring-purple-500"
                        >
                            <option value={10}>10</option>
                            <option value={20}>20</option>
                            <option value={50}>50</option>
                            <option value={100}>100</option>
                        </select>
                    </div>
                </div>

                {totalPages > 1 && (
                    <Pagination className="mx-0 w-auto">
                        <PaginationContent>
                            <PaginationItem>
                                <PaginationPrevious
                                    onClick={(e) => {
                                        e.preventDefault();
                                        if (page > 1) setPage(page - 1);
                                    }}
                                    className={`cursor-pointer ${page <= 1 ? "pointer-events-none opacity-40" : ""
                                        }`}
                                />
                            </PaginationItem>

                            {renderPaginationItems()}

                            <PaginationItem>
                                <PaginationNext
                                    onClick={(e) => {
                                        e.preventDefault();
                                        if (page < totalPages) setPage(page + 1);
                                    }}
                                    className={`cursor-pointer ${page >= totalPages ? "pointer-events-none opacity-40" : ""
                                        }`}
                                />
                            </PaginationItem>
                        </PaginationContent>
                    </Pagination>
                )}
            </div>

            {/* --- Main Content / State Views --- */}
            {isLoading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {Array.from({ length: 8 }).map((_, idx) => (
                        <Card key={idx} className="p-4 space-y-3 animate-pulse border border-gray-200">
                            <div className="w-full h-40 bg-gray-200 rounded-lg"></div>
                            <div className="h-4 bg-gray-200 rounded-xs w-3/4"></div>
                            <div className="h-3 bg-gray-200 rounded-xs w-1/2"></div>
                            <div className="h-9 bg-gray-200 rounded-lg w-full mt-2"></div>
                        </Card>
                    ))}
                </div>
            ) : isError ? (
                <div className="flex flex-col items-center justify-center p-12 bg-red-50 rounded-2xl border border-red-200 text-center">
                    <AlertCircle className="w-12 h-12 text-red-500 mb-3" />
                    <h3 className="text-lg font-bold text-red-900 mb-1">Failed to Load Orphan Models</h3>
                    <p className="text-sm text-red-600 max-w-md mb-4">
                        {(error as Error)?.message || "An unexpected error occurred while fetching device data."}
                    </p>
                    <Button
                        onClick={() => queryClient.invalidateQueries({ queryKey: ["orphan-devices"] })}
                        variant="outline"
                        className="border-red-300 text-red-700 hover:bg-red-100"
                    >
                        Try Again
                    </Button>
                </div>
            ) : filteredDevices.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-16 bg-white rounded-2xl border border-dashed border-gray-300 text-center space-y-3">
                    <div className="w-14 h-14 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center">
                        <Sparkles className="w-7 h-7" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-800">
                        {searchText ? "No Matching Models Found" : "All Models Categorized!"}
                    </h3>
                    <p className="text-sm text-gray-500 max-w-md">
                        {searchText
                            ? `No orphan models matched "${searchText}". Try adjusting your search term.`
                            : "Great job! There are currently no orphan models pending model codes on this page."}
                    </p>
                    {searchText && (
                        <Button
                            onClick={() => setSearchText("")}
                            variant="link"
                            className="text-purple-600 font-semibold"
                        >
                            Clear Search Filter
                        </Button>
                    )}
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {filteredDevices.map((device) => (
                        <OrphanModelCard
                            key={device._id}
                            device={device}
                            onAddCodes={() => handleOpenAddModal(device)}
                        />
                    ))}
                </div>
            )}

            {/* --- Bottom Pagination --- */}
            {!isLoading && !isError && totalPages > 1 && (
                <div className="flex justify-center pt-4">
                    <Pagination>
                        <PaginationContent>
                            <PaginationItem>
                                <PaginationPrevious
                                    onClick={(e) => {
                                        e.preventDefault();
                                        if (page > 1) setPage(page - 1);
                                    }}
                                    className={`cursor-pointer ${page <= 1 ? "pointer-events-none opacity-40" : ""
                                        }`}
                                />
                            </PaginationItem>
                            {renderPaginationItems()}
                            <PaginationItem>
                                <PaginationNext
                                    onClick={(e) => {
                                        e.preventDefault();
                                        if (page < totalPages) setPage(page + 1);
                                    }}
                                    className={`cursor-pointer ${page >= totalPages ? "pointer-events-none opacity-40" : ""
                                        }`}
                                />
                            </PaginationItem>
                        </PaginationContent>
                    </Pagination>
                </div>
            )}

            {/* --- Add Model Codes Modal --- */}
            <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-xl font-bold">
                            <Tag className="w-5 h-5 text-purple-600" />
                            Add Model Codes
                        </DialogTitle>
                        <DialogDescription className="text-sm text-gray-500">
                            Assign one or more unique model codes (e.g. SM-A525F) to{" "}
                            <strong className="text-gray-800">
                                {selectedDevice?.brand} {selectedDevice?.model}
                            </strong>
                            .
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-2">


                        {/* Input Tag Field */}
                        <div className="space-y-2">
                            <Label htmlFor="modelCodeInput" className="text-sm font-medium">
                                Enter Model Code
                            </Label>
                            <div className="flex gap-2">
                                <Input
                                    id="modelCodeInput"
                                    placeholder="e.g. SM-A525F/DS"
                                    value={newModelCode}
                                    onChange={(e) => setNewModelCode(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter") {
                                            e.preventDefault();
                                            handleAddModelCode();
                                        }
                                    }}
                                    className="h-10 text-sm"
                                />
                                <Button
                                    type="button"
                                    onClick={handleAddModelCode}
                                    className="bg-purple-600 hover:bg-purple-700 text-white h-10 px-4 shrink-0"
                                >
                                    <Plus className="w-4 h-4 mr-1" /> Add
                                </Button>
                            </div>
                            <p className="text-xs text-gray-400">
                                Press Enter or click Add to add multiple codes to the list.
                            </p>
                        </div>

                        {/* Added Model Codes List */}
                        <div className="space-y-1.5">
                            <Label className="text-xs font-semibold text-gray-700">
                                Model Codes to Save ({modelCodesList.length})
                            </Label>

                            {modelCodesList.length === 0 ? (
                                <div className="p-3 text-center text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-lg">
                                    No model codes added yet. Type a code above and click Add.
                                </div>
                            ) : (
                                <div className="flex flex-wrap gap-2 max-h-36 overflow-y-auto p-2 border border-gray-200 rounded-lg bg-gray-50">
                                    {modelCodesList.map((code) => (
                                        <Badge
                                            key={code}
                                            variant="secondary"
                                            className="bg-white border border-gray-300 text-gray-800 gap-1.5 px-2.5 py-1 text-xs font-medium shadow-xs"
                                        >
                                            {code}
                                            <X
                                                className="w-3 h-3 text-gray-400 hover:text-red-600 cursor-pointer"
                                                onClick={() => handleRemoveModelCode(code)}
                                            />
                                        </Badge>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setIsFormOpen(false)}
                            disabled={updateModelCodesMutation.isPending}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="button"
                            onClick={handleSaveModelCodes}
                            disabled={
                                modelCodesList.length === 0 || updateModelCodesMutation.isPending
                            }
                            className="bg-purple-600 hover:bg-purple-700 text-white"
                        >
                            {updateModelCodesMutation.isPending ? (
                                <>
                                    <Loader className="w-4 h-4 mr-2 animate-spin" /> Saving...
                                </>
                            ) : (
                                "Save Model Codes"
                            )}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default OrphanModels;

// --- Single Card Component ---
interface OrphanModelCardProps {
    device: OrphanDevice;
    onAddCodes: () => void;
}

const OrphanModelCard = ({ device, onAddCodes }: OrphanModelCardProps) => {
    const [imgError, setImgError] = useState(false);

    return (
        <Card className="group flex flex-col justify-between overflow-hidden border border-gray-200 hover:border-purple-300 hover:shadow-lg transition-all duration-200 rounded-xl bg-white">
            <div>


                {/* Device Image Box */}
                < div className="relative w-full h-44 p-4 flex items-center justify-center bg-gray-50/50 group-hover:bg-purple-50/20 transition-colors">
                    {device.imageUrl && !imgError ? (
                        <img
                            src={device.imageUrl}
                            alt={`${device.brand} ${device.model}`}
                            onError={() => setImgError(true)}
                            className="max-h-full max-w-full object-contain drop-shadow-xs transition-transform duration-300 group-hover:scale-105"
                            loading="lazy"
                        />
                    ) : (
                        <div className="flex flex-col items-center justify-center text-gray-300 space-y-1">
                            <Smartphone className="w-12 h-12 stroke-[1.5]" />
                            <span className="text-xs text-gray-400">No Image</span>
                        </div>
                    )}
                </div>

                {/* Main Details Body */}
                <div className="p-4 space-y-2">
                    <h3 className="font-bold text-gray-900 text-base line-clamp-2 leading-snug">
                        {device.model || device.detailedSpecifications?.title || "Unknown Model"}
                    </h3>




                </div>
            </div>

            {/* Footer Action Button */}
            <div className="p-4 pt-0">
                <Button
                    onClick={onAddCodes}
                    className="w-full bg-purple-600 hover:bg-purple-700 text-white font-medium h-9 text-xs shadow-xs transition-colors gap-1.5"
                >
                    <Plus className="w-4 h-4" /> Add Model Codes
                </Button>
            </div>
        </Card >
    );
};
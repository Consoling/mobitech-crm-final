import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import SearchFilterBar from "@/components/common/SearchFilterBar";
import ConfirmDialog from "@/components/common/ConfirmDialog";
import { mobileBrands } from "@/constants/const";
import { apiFetch } from "@/lib/api";
import { Loader, Plus, Trash2, Eye, Pencil, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import toast from "react-hot-toast";

interface BrandData {
  id: string;
  name: string;
  logo: string;
  apiEndpoint: string;
}

interface ModelData {
  _id: string;
  model: string;
  price?: number;
  imageUrl?: string;
  modelCodes?: string[];
  specifications?: Record<string, any>;
  smc?: number;
}

interface PaginationData {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

const ModelsView = () => {
  const brandId = useParams().brandId;
  const [brandData, setBrandData] = useState<BrandData>();
  const [loadingData, setLoadingData] = useState<boolean>(false);
  const [searchData, setSearchData] = useState<string>("");
  const [models, setModels] = useState<ModelData[]>([]);
  const [pagination, setPagination] = useState<PaginationData | null>(null);
  const [loadingMore, setLoadingMore] = useState<boolean>(false);
  const [hasMore, setHasMore] = useState<boolean>(true);
  const [selectedModel, setSelectedModel] = useState<ModelData | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState<boolean>(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState<boolean>(false);
  const [modelToDelete, setModelToDelete] = useState<ModelData | null>(null);
  const [isModelFormOpen, setIsModelFormOpen] = useState<boolean>(false);
  const [_formMode, setFormMode] = useState<'add' | 'edit'>('add');
  const [editingModel, setEditingModel] = useState<ModelData | null>(null);
  const [isSavingModel, setIsSavingModel] = useState<boolean>(false);

  const observerTarget = useRef<HTMLDivElement>(null);
  const currentPage = useRef<number>(1);
  const searchTimeout = useRef<number | null>(null);
  const route = useNavigate();

  // Form state
  const [formData, setFormData] = useState({
    modelCode: '',
    modelCodes: [] as string[],
  });

  const handleOpenAddModel = () => {
    setFormMode('add');
    setEditingModel(null);
    setFormData({
      modelCode: '',
      modelCodes: [],
    });
    setIsModelFormOpen(true);
  };

  const handleOpenEditModel = (model: ModelData) => {
    setFormMode('edit');
    setEditingModel(model);
    setFormData({
      modelCode: '',
      modelCodes: model.modelCodes || [],
    });
    setIsModelFormOpen(true);
  };

  const handleAddModelCode = () => {
    if (!formData.modelCode.trim()) {
      toast.error('Please enter a model code');
      return;
    }
    
    if (formData.modelCodes.includes(formData.modelCode.trim())) {
      toast.error('This model code already exists');
      return;
    }

    setFormData({
      ...formData,
      modelCodes: [...formData.modelCodes, formData.modelCode.trim()],
      modelCode: '',
    });
  };

  const handleRemoveModelCode = (code: string) => {
    setFormData({
      ...formData,
      modelCodes: formData.modelCodes.filter(c => c !== code),
    });
  };

  const handleSaveModel = async () => {
    if (formData.modelCodes.length === 0) {
      toast.error('Please add at least one model code');
      return;
    }

    setIsSavingModel(true);
    try {
      // Update model codes
      const response = await apiFetch(`/models/model/${editingModel?.smc}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          modelCodes: formData.modelCodes,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        setModels(models.map(m => m._id === editingModel?._id ? result.data : m));
        toast.success('Model codes updated successfully');
        setIsModelFormOpen(false);
      } else {
        toast.error('Failed to update model codes');
      }
    } catch (error) {
      console.error('Error saving model codes:', error);
      toast.error('Failed to save model codes');
    } finally {
      setIsSavingModel(false);
    }
  };
  
  const handleDeleteModel = async () => {
    if (!modelToDelete) return;

    try {
      // TODO: Call delete API endpoint
      console.log("Deleting model:", modelToDelete._id);
      // After successful delete, refresh the list or remove from state
      setModels((prev) => prev.filter((m) => m._id !== modelToDelete._id));
    } catch (error) {
      console.error("Error deleting model:", error);
    } finally {
      setIsDeleteDialogOpen(false);
      setModelToDelete(null);
    }
  };

  const fetchModelsForBrand = useCallback(
    async (
      brand: string,
      page: number,
      search: string = "",
      append: boolean = false,
    ) => {
      try {
        if (!append) {
          setLoadingData(true);
        } else {
          setLoadingMore(true);
        }

        const params = new URLSearchParams({
          page: page.toString(),
          limit: "10",
        });

        if (search) {
          params.append("search", search);
        }

        const response = await apiFetch(
          `/models/${brand}?${params.toString()}`,
        );

        if (!response.ok) {
          console.error("Failed to fetch models");
          return;
        }

        const result = await response.json();

        if (result.success && result.data) {
          if (append) {
            setModels((prev) => [...prev, ...result.data]);
          } else {
            setModels(result.data);
          }
          setPagination(result.pagination);
          setHasMore(result.pagination.page < result.pagination.totalPages);
        }
      } catch (error) {
        console.error("Error fetching brand models:", error);
      } finally {
        setLoadingData(false);
        setLoadingMore(false);
      }
    },
    [],
  );

  // Initial brand data setup
  useEffect(() => {
    if (!brandId) return;

    const brand = mobileBrands.find((b) => b.id === brandId);
    if (brand) {
      setBrandData(brand);
    }
  }, [brandId]);

  // Fetch models when brand or search changes
  useEffect(() => {
    if (!brandId) return;

    // Debounce search
    if (searchTimeout.current) {
      clearTimeout(searchTimeout.current);
    }

    searchTimeout.current = setTimeout(() => {
      // Reset state only when actually fetching
      currentPage.current = 1;
      setModels([]);
      setHasMore(true);
      fetchModelsForBrand(brandId, 1, searchData, false);
    }, 300);

    return () => {
      if (searchTimeout.current) {
        clearTimeout(searchTimeout.current);
      }
    };
  }, [brandId, searchData, fetchModelsForBrand]);

  // Infinite scroll observer
  useEffect(() => {
    if (!hasMore || loadingMore || loadingData) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && pagination) {
          currentPage.current += 1;
          fetchModelsForBrand(brandId!, currentPage.current, searchData, true);
        }
      },
      { threshold: 0.1 },
    );

    const currentTarget = observerTarget.current;
    if (currentTarget) {
      observer.observe(currentTarget);
    }

    return () => {
      if (currentTarget) {
        observer.unobserve(currentTarget);
      }
    };
  }, [
    hasMore,
    loadingMore,
    loadingData,
    pagination,
    brandId,
    searchData,
    fetchModelsForBrand,
  ]);

  if (!brandData) {
    return (
      <div className="h-screen flex items-center justify-center">
        <p className="text-gray-500 text-lg">Error loading data...</p>
      </div>
    );
  }
  return (
    <div className="mx-auto max-[600px]:px-4 px-10">
      {/* Layer 1 */}
      <div className="flex max-[980px]:flex-col max-[980px]:justify-start max-[980px]:items-start gap-5 py-4 justify-between items-center">
        <div className="flex gap-5">
          <div className="bg-white rounded-full">
            <img
              src={brandData.logo}
              alt={brandData.name}
              className="w-16 h-16 object-cover p-2"
            />
          </div>
          <div className="flex flex-col justify-center">
            <h1 className="text-2xl font-bold">{brandData.name} Models</h1>
            <p className="text-gray-500 text-sm">
              Browse and manage all {brandData.name} device models
            </p>
          </div>
        </div>

        <div className="px-3 items-center justify-center flex max-[980px]:w-full">
          <Button
            onClick={() => route(`/model/${brandId}/add`)}
            className="flex items-center gap-1.5 max-[980px]:w-full"
            variant={"custom-one"}
          >
            <Plus />
            <p>Add New Model</p>
          </Button>
        </div>
      </div>

      {/* Layer 2 */}

      <SearchFilterBar
        wrapperClassName="mt-5 flex items-center justify-between"
        inputClassName="h-10.5 pl-10 text-sm caret-slow-blink"
        placeholder="Search models by name or model code..."
        value={searchData}
        onValueChange={setSearchData}
      />

      {/* Loading indicator for search */}
      {loadingData && models.length > 0 && (
        <div className="mt-4 flex items-center gap-2 text-sm text-gray-500">
          <Loader className="animate-spin w-4 h-4" />
          <span>Searching...</span>
        </div>
      )}

      {/* Layer 3 */}

      <div className="mt-10">
        {loadingData && models.length === 0 ? (
          <div className="flex items-center justify-center py-20">
            <Loader className="animate-spin w-8 h-8 text-purple-600" />
          </div>
        ) : models.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <p className="text-gray-500 text-lg">No models found</p>
            {searchData && (
              <p className="text-gray-400 text-sm mt-2">
                Try adjusting your search
              </p>
            )}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 lg:grid-cols-2 *:grid-cols-3 [@media(min-width:1560px)]:grid-cols-3 gap-6">
              {models.map((model) => (
                <Card
                  key={model._id}
                  className="rounded-[17px] w-97.75 h-52 overflow-hidden hover:shadow-lg transition-shadow p-6"
                >
                  <div className="flex  md:flex-row gap-6 h-full">
                    {/* Image Section */}
                    <div className="w-16 h-18.25 bg-linear-to-br from-purple-100 to-purple-50 rounded-[8px] flex items-center justify-center shrink-0 p-2">
                      {model.imageUrl ? (
                        <img
                          src={model.imageUrl}
                          alt={model.model}
                          className="w-full h-full object-contain"
                        />
                      ) : (
                        <div className="text-gray-400 text-center">
                          <p className="text-xs">No Image</p>
                        </div>
                      )}
                    </div>

                    {/* Content Section */}
                    <div className="flex-1 flex flex-col min-w-0">
                      <div className="flex-1">
                        <div className="flex justify-between gap-5 items-start">
                          <div className="flex-1 mb-3 marquee-container group overflow-hidden">
                            <h3 className="font-bold text-base font-inter truncate group-hover:cursor-pointer group-hover:truncate-none group-hover:overflow-visible group-hover:whitespace-nowrap group-hover:inline-block group-hover:animate-marquee-on-hover">
                              {model.model}
                              <span className="hidden group-hover:inline mx-8">
                                {model.model}
                              </span>
                              <span className="hidden group-hover:inline mx-8">
                                {model.model}
                              </span>
                            </h3>
                          </div>
                          <div className="gap-1.5 flex shrink-0">
                            <div 
                              onClick={() => handleOpenEditModel(model)}
                              className="rounded-full h-8 w-8 bg-black flex items-center justify-center hover:cursor-pointer hover:bg-gray-800 transition-colors"
                            >
                              <Pencil className="text-white" size={12} />
                            </div>
                            <div 
                              onClick={handleOpenAddModel}
                              className="rounded-full h-8 w-8 bg-gray-300 flex items-center justify-center hover:cursor-pointer hover:bg-gray-400 transition-colors"
                            >
                              <Plus className="text-black" size={12} />
                            </div>
                          </div>
                        </div>

                        {/* Model Codes */}
                        {model.modelCodes && model.modelCodes.length > 0 && (
                          <div className="flex flex-wrap gap-2 mb-2 mt-2">
                            {model.modelCodes.slice(0, 3).map((code, index) => (
                              <span
                                key={index}
                                className="px-3 py-1.5 bg-[#FAFAFA] text-[#646464] border border-[#ADADAD] text-xs rounded-full font-medium"
                              >
                                {code}
                              </span>
                            ))}
                            {model.modelCodes.length > 3 ? (
                              <span
                                onClick={() => {
                                  setSelectedModel(model);
                                  setIsDialogOpen(true);
                                }}
                                className="px-3 py-1.5 bg-[#FAFAFA] text-[#646464] border border-[#ADADAD] text-xs rounded-full font-medium cursor-pointer hover:bg-gray-200"
                              >
                                View more
                              </span>
                            ) : (
                              model.modelCodes.length === 4 && (
                                <span className="px-3 py-1.5 bg-[#FAFAFA] text-[#646464] border border-[#ADADAD] text-xs rounded-full font-medium">
                                  {model.modelCodes[3]}
                                </span>
                              )
                            )}
                          </div>
                        )}
                      </div>

                      <div className="mt-auto">
                        <Separator
                          orientation="horizontal"
                          className="mt-1 mb-2"
                        />

                        {/* Action Buttons */}
                        <div className="flex items-center gap-3 mt-1">
                          <button
                            onClick={() => {
                              route(`/model/${brandId}/${model.smc}`);
                            }}
                            className="bg-[#2C2C2C] transition-colors delay-150 ease-linear hover:bg-gray-800 text-white text-xs rounded-full px-4 py-2 hover:cursor-pointer flex justify-between items-center"
                          >
                            <Eye className="w-4 h-4 mr-2" />
                            View Details
                          </button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setModelToDelete(model);
                              setIsDeleteDialogOpen(true);
                            }}
                            className="rounded-full bg-red-50 hover:bg-red-100 text-red-500 hover:text-red-600"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            {/* Infinite scroll trigger */}
            {hasMore && (
              <div
                ref={observerTarget}
                className="flex items-center justify-center py-10"
              >
                {loadingMore && (
                  <Loader className="animate-spin w-6 h-6 text-purple-600" />
                )}
              </div>
            )}

            {!hasMore && models.length > 0 && (
              <div className="text-center py-10 text-gray-500 text-sm">
                No more models to load
              </div>
            )}
          </>
        )}
      </div>

      {/* Model Codes Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-125">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Model Codes</DialogTitle>
            <DialogDescription>
              All available model codes for {selectedModel?.model}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {/* Model Info */}
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 bg-linear-to-br from-purple-100 to-purple-50 rounded-xl flex items-center justify-center p-3">
                {selectedModel?.imageUrl ? (
                  <img
                    src={selectedModel.imageUrl}
                    alt={selectedModel.model}
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <div className="text-gray-400 text-center">
                    <p className="text-xs">No Image</p>
                  </div>
                )}
              </div>
              <div>
                <h3 className="font-bold text-lg">{selectedModel?.model}</h3>
              </div>
            </div>

            {/* Model Codes */}
            <div>
              <h4 className="text-sm font-semibold mb-3 text-gray-700">
                Available Model Codes:
              </h4>
              <div className="flex flex-wrap gap-2">
                {selectedModel?.modelCodes?.map((code, index) => (
                  <Badge
                    key={index}
                    variant="secondary"
                    className="text-xs py-1.5 px-3"
                  >
                    {code}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        onConfirm={handleDeleteModel}
        title="Are you sure?"
        description="This action cannot be undone."
        confirmText="Proceed"
        cancelText="Cancel"
      />

      {/* Manage Model Codes Dialog */}
      <Dialog open={isModelFormOpen} onOpenChange={setIsModelFormOpen}>
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">
              Manage Model Codes
            </DialogTitle>
            <DialogDescription>
              {editingModel?.model ? `Update model codes for ${editingModel.model}` : 'Add and remove model codes'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Add Model Code Input */}
            <div className="space-y-2">
              <Label htmlFor="modelCode" className="text-sm font-semibold text-gray-700">
                Add New Model Code
              </Label>
              <div className="flex gap-2">
                <Input
                  id="modelCode"
                  value={formData.modelCode}
                  onChange={(e) => setFormData({ ...formData, modelCode: e.target.value })}
                  onKeyPress={(e) => e.key === 'Enter' && handleAddModelCode()}
                  placeholder="Enter model code..."
                  className="h-11"
                />
                <Button 
                  onClick={handleAddModelCode}
                  type="button"
                  size="sm"
                  className="px-6"
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Existing Model Codes */}
            <div className="space-y-2">
              <Label className="text-sm font-semibold text-gray-700">
                {editingModel ? 'Existing Model Codes' : 'Model Codes'} ({formData.modelCodes.length})
              </Label>
              {formData.modelCodes.length > 0 ? (
                <div className="flex flex-wrap gap-2 p-4 bg-gray-50 rounded-lg border border-gray-200 min-h-[100px]">
                  {formData.modelCodes.map((code, index) => (
                    <Badge
                      key={index}
                      variant="secondary"
                      className="px-3 py-2 text-sm flex items-center gap-2 hover:bg-red-50 cursor-pointer group transition-colors"
                      onClick={() => handleRemoveModelCode(code)}
                    >
                      {code}
                      <X className="w-3 h-3 text-gray-500 group-hover:text-red-500 transition-colors" />
                    </Badge>
                  ))}
                </div>
              ) : (
                <div className="p-8 bg-gray-50 rounded-lg border border-gray-200 text-center">
                  <p className="text-gray-400 text-sm">
                    {editingModel ? 'No model codes found for this model' : 'No model codes added yet'}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => setIsModelFormOpen(false)}
              disabled={isSavingModel}
              className="px-6"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveModel}
              disabled={isSavingModel || formData.modelCodes.length === 0}
              className="px-6"
              style={{ background: 'linear-gradient(90deg, #155DFC 0%, #1447E6 100%)' }}
            >
              {isSavingModel ? (
                <>
                  <Loader className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ModelsView;

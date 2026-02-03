import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { COMMON_VARIANTS, mobileBrands } from "@/constants/const";
import { apiFetch } from "@/lib/api";
import { OctagonAlert, Pen, Plus, Trash2, X } from "lucide-react";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useParams } from "react-router-dom";

interface FetchedMetadata {
  brandName: string;
  modelId: string;
}

interface BrandData {
  name: string;
  logo: string;
}
const ModelView = () => {
  const [fetchedMetadata, setFetchedMetaData] =
    useState<FetchedMetadata | null>(null);
  const [loadingMetaData, setLoadingMetaData] = useState<boolean>(true);
  const [brandData, setBrandData] = useState<BrandData | null>(null);
  const [modelData, setModelData] = useState<any | null>(null);
  const [editedModelData, setEditedModelData] = useState<any | null>(null);
  const [newVariant, setNewVariant] = useState({ name: "", price: "" });
  const [hasChanges, setHasChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isEditingImage, setIsEditingImage] = useState(false);
  const [isEditingBasicInfo, setIsEditingBasicInfo] = useState(false);
  const [newImageUrl, setNewImageUrl] = useState("");
  const urlParams = useParams();

  const addVariant = () => {
    if (!newVariant.name || !newVariant.price) {
      toast.error("Please fill in both variant name and price");
      return;
    }

    const currentVariants = editedModelData?.detailedSpecifications?.variants || [];
    const updatedVariants = [
      ...currentVariants,
      {
        _id: `temp-${Date.now()}`, // Temporary ID for new variants
        name: newVariant.name,
        price: newVariant.price,
      },
    ];

    setEditedModelData({
      ...editedModelData,
      detailedSpecifications: {
        ...editedModelData?.detailedSpecifications,
        variants: updatedVariants,
      },
    });
    setHasChanges(true);
    toast.success("Variant added (unsaved)");
    setNewVariant({ name: "", price: "" });
  };

  const removeVariant = (variantId: string) => {
    const currentVariants = editedModelData?.detailedSpecifications?.variants || [];
    const updatedVariants = currentVariants.filter(
      (variant: any) => variant._id !== variantId
    );

    setEditedModelData({
      ...editedModelData,
      detailedSpecifications: {
        ...editedModelData?.detailedSpecifications,
        variants: updatedVariants,
      },
    });
    setHasChanges(true);
    toast.success("Variant removed (unsaved)");
  };


  const updateBasicInfo = (field: string, value: string) => {
    setEditedModelData({
      ...editedModelData,
      detailedSpecifications: {
        ...editedModelData?.detailedSpecifications,
        [field]: value,
      },
    });
    setHasChanges(true);
  };

  const toggleImageEdit = () => {
    setIsEditingImage(!isEditingImage);
    if (!isEditingImage) {
      setNewImageUrl("");
    }
  };

  const toggleBasicInfoEdit = () => {
    setIsEditingBasicInfo(!isEditingBasicInfo);
  };

  const addImageUrl = () => {
    if (!newImageUrl.trim()) {
      toast.error("Please enter an image URL");
      return;
    }

    setEditedModelData({
      ...editedModelData,
      imageUrl: newImageUrl.trim(),
    });
    setHasChanges(true);
    toast.success("Image URL added (unsaved)");
    setNewImageUrl("");
  };

  const removeImage = () => {
    setEditedModelData({
      ...editedModelData,
      imageUrl: null,
    });
    setHasChanges(true);
    toast.success("Image removed (unsaved)");
  };

  const handleSave = async () => {
    if (!hasChanges) {
      toast.error("No changes to save");
      return;
    }

    setIsSaving(true);
    try {
      // Clean up variants - remove temporary IDs for new variants
      const cleanedVariants = editedModelData?.detailedSpecifications?.variants?.map((variant: any) => {
        if (variant._id && variant._id.startsWith('temp-')) {
          // Remove temporary ID, let MongoDB generate a real one
          const { _id, ...rest } = variant;
          return rest;
        }
        return variant;
      });

      const response = await apiFetch(`/models/model/${modelData.smc}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          modelCodes: editedModelData?.modelCodes,
          variants: cleanedVariants,
          detailedSpecifications: {
            ...editedModelData?.detailedSpecifications,
            variants: cleanedVariants,
          },
          imageUrl: editedModelData?.imageUrl,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        setModelData(result.data);
        setEditedModelData(result.data);
        setHasChanges(false);
        setIsEditingImage(false);
        setIsEditingBasicInfo(false);
        toast.success("Model updated successfully");
      } else {
        toast.error("Failed to update model");
      }
    } catch (error) {
      console.error("Error updating model:", error);
      toast.error("Failed to update model");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    if (hasChanges) {
      const confirm = window.confirm("You have unsaved changes. Are you sure you want to discard them?");
      if (!confirm) return;
    }
    setEditedModelData(modelData);
    setHasChanges(false);
    setIsEditingImage(false);
    setIsEditingBasicInfo(false);
    setNewImageUrl("");
    toast.success("Changes discarded");
  };

  useEffect(() => {
    // Extract URL params
    const brandName = urlParams.brandName || "";
    const modelId = urlParams.modelId || "";

    // Find brand data
    const foundData = mobileBrands.find(
      (brand) => brand.name.toLowerCase() === brandName.toLowerCase(),
    );

    const modelDataFetch = async () => {
      try {
        const response = await apiFetch(`/models/model/${modelId}`);

        if (response.ok) {
          const result = await response.json();
          setModelData(result.data);
          setEditedModelData(result.data); // Initialize edited data
        }
      } catch (error) {
        console.error("Error fetching model data:", error);
        toast.error("Failed to fetch model data.");
      }
    };

    modelDataFetch();

    // Update all state in sequence
    setFetchedMetaData({ brandName, modelId });
    setBrandData(foundData || null);
    setLoadingMetaData(false);
  }, [urlParams.brandName, urlParams.modelId]);
  if (loadingMetaData) {
    return (
      <div className="h-screen flex flex-col gap-4 items-center justify-center">
        <div className="loader ease-linear rounded-full border-8 border-t-8 border-gray-200 h-16 w-16"></div>
        <p className="text-gray-500 text-lg">Fetching data...</p>
      </div>
    );
  }

  if (!fetchedMetadata?.brandName || !fetchedMetadata?.modelId || !brandData) {
    return (
      <div className="h-screen flex flex-col gap-4 items-center justify-center">
        <OctagonAlert className="w-12 h-12 text-red-500" />
        <p className="text-gray-500 text-lg">Error loading data...</p>
        <Button className="ml-4" onClick={() => window.history.back()}>
          Back
        </Button>
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
            <h1 className="text-2xl font-bold">View Model</h1>
            <p className="text-gray-500 text-sm">
              View mobile model with complete specifications
            </p>
          </div>
        </div>
      </div>

          {/* Layer 2 */}

          <Card className="px-5 mt-4 w-full rounded-[16px] border border-[#E2E8F0] py-4">
            <h2 className="text-base font-bold ">Category</h2>
            <Select>
              <SelectTrigger className="w-full -mt-2.5 mb-1">
                <SelectValue placeholder="Phone" className="" />
              </SelectTrigger>
            </Select>
          </Card>

      {/* Layer 3 */}

      <Card className="px-5 mt-4 w-full rounded-[16px] border border-[#E2E8F0] pt-7 pb-7 flex flex-col gap-4 ">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold mb-4">Product Image</h2>
          <Button onClick={toggleImageEdit} className="w-[90px]">
            <Pen className="text-white" size={9} />{" "}
            <span className="ml-0.5 text-sm">{isEditingImage ? "Editing" : "Edit"}</span>
          </Button>
        </div>

        {/* Image URL Input (shown when editing) */}
        {isEditingImage && (
          <div className="mb-4">
            <span className="text-[#314158] text-sm">Add Image URL</span>
            <div className="flex gap-2 mt-1.5">
              <Input
                value={newImageUrl}
                onChange={(e) => setNewImageUrl(e.target.value)}
                placeholder="Paste image URL here..."
                onKeyPress={(e) => e.key === "Enter" && addImageUrl()}
                className="flex-1"
              />
              <Button onClick={addImageUrl} size="sm">
                Add <Plus />
              </Button>
            </div>
          </div>
        )}

        {/* Image Carousel */}
        <div className="w-full overflow-x-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
          <div className="flex gap-4 pb-2">
            {editedModelData?.imageUrl ? (
              // If single image, show one card
              <div className="flex-shrink-0 w-[298px] h-[368px] rounded-[14px] border border-gray-200 overflow-hidden bg-white shadow-sm relative group">
                <img
                  src={editedModelData.imageUrl}
                  alt={editedModelData.model || "Product"}
                  className="w-full h-full object-contain p-4"
                />
                {isEditingImage && (
                  <button
                    onClick={removeImage}
                    className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-1.5 shadow-lg transition-all opacity-0 group-hover:opacity-100"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            ) : editedModelData?.images && Array.isArray(editedModelData.images) ? (
              // If multiple images array exists, show all cards
              editedModelData.images.map((image: string, index: number) => (
                <div
                  key={index}
                  className="flex-shrink-0 w-[298px] h-[368px] rounded-[14px] border border-gray-200 overflow-hidden bg-white shadow-sm relative group"
                >
                  <img
                    src={image}
                    alt={`${editedModelData.model || "Product"} ${index + 1}`}
                    className="w-full h-full object-contain p-4"
                  />
                  {isEditingImage && (
                    <button
                      onClick={removeImage}
                      className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-1.5 shadow-lg transition-all opacity-0 group-hover:opacity-100"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))
            ) : (
              <div className="flex-shrink-0 w-[298px] h-[368px] rounded-[14px] border border-gray-200 flex items-center justify-center bg-gray-50">
                <p className="text-gray-400">No image available</p>
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Layer 4 */}

      <Card className="px-5 mt-4 w-full rounded-[16px] border border-[#E2E8F0] py-4">
        <div className="flex justify-between items-center">
          <h2 className="text-base font-bold ">Basic Information</h2>
          <Button onClick={toggleBasicInfoEdit} className="w-[90px]">
            <Pen className="text-white" size={9} />{" "}
            <span className="ml-0.5 text-sm">{isEditingBasicInfo ? "Editing" : "Edit"}</span>
          </Button>
        </div>
        <div className="mt-1">
          <span className="text-[#314158] text-sm ">Model Name</span>
          <Input
            value={editedModelData?.detailedSpecifications?.title ?? ""}
            onChange={(e) => updateBasicInfo("title", e.target.value)}
            className="h-[46px] font-inter mt-1.5 placeholder:px-4 text-[13px] text-[#0F172BA3] font-medium"
            readOnly={!isEditingBasicInfo}
          />
        </div>
      </Card>

      {/* Layer 5 */}

      <Card className="px-5 mt-4 w-full rounded-[16px] border border-[#E2E8F0] py-4">
        <div className="flex justify-between items-center mt-4">
          <h2 className="text-base font-bold ">
            Variants ({editedModelData?.detailedSpecifications?.variants?.length ?? 0})
          </h2>
        </div>
        {/* New Variants Addition */}
        <div className="mt-4">
          <span className="text-[#314158] text-sm ">Add New Variants</span>
          <div className="flex gap-2 mt-1.5">
            <Select
              value={newVariant.name}
              onValueChange={(value) =>
                setNewVariant({ ...newVariant, name: value })
              }
            >
              <SelectTrigger className="flex-1">
                <SelectValue placeholder="Select variant" />
              </SelectTrigger>
              <SelectContent>
                {COMMON_VARIANTS.map((variant) => (
                  <SelectItem key={variant} value={variant}>
                    {variant}
                  </SelectItem>
                ))}
                <SelectItem value="custom">Custom variant...</SelectItem>
              </SelectContent>
            </Select>

            {/* Show custom input if "custom" is selected */}
            {newVariant.name === "custom" && (
              <Input
                value=""
                onChange={(e) =>
                  setNewVariant({
                    ...newVariant,
                    name: e.target.value,
                  })
                }
                placeholder="Enter custom variant"
                className="flex-1"
                autoFocus
              />
            )}

            <Input
              value={newVariant.price}
              onChange={(e) =>
                setNewVariant({
                  ...newVariant,
                  price: e.target.value,
                })
              }
              placeholder="e.g., ₹23,999 or 0"
              className="flex-1"
            />
            <Button onClick={addVariant} size="sm">
              <Plus className="w-4 h-4" />
            </Button>
          </div>
        </div>
        {/* Existing Variants List */}
        {editedModelData?.detailedSpecifications?.variants &&
          editedModelData.detailedSpecifications.variants.length > 0 && (
            <div className="mt-4 space-y-2">
              <span className="text-[#314158] text-sm font-medium">
                Existing Variants
              </span>
              <div className="space-y-2 mt-2">
                {editedModelData.detailedSpecifications.variants.map(
                  (variant: any) => (
                    <div key={variant._id} className="flex gap-2 items-center">
                      <Input
                        value={variant.name}
                        className="flex-1 h-[46px] font-inter text-[13px] text-[#0F172BA3] font-medium bg-gray-50"
                        readOnly
                      />
                      <Input
                        value={variant.price === "0" ? "₹0" : variant.price}
                        className="flex-1 h-[46px] font-inter text-[13px] text-[#0F172BA3] font-medium bg-gray-50"
                        readOnly
                      />

                      <Trash2
                        className="w-4 h-4 text-red-400 cursor-pointer hover:text-red-600"
                        onClick={() => removeVariant(variant._id)}
                      />
                    </div>
                  ),
                )}
              </div>
            </div>
          )}
      </Card>
 



      <div className="my-20 flex justify-end gap-4 rounded-[34px]">
        <Button 
          onClick={handleCancel}
          className="py-3 px-6 w-[153px] h-[50px]"
          variant="outline"
          disabled={isSaving}
        >
          Cancel
        </Button>
        <Button 
          onClick={handleSave}
          className="py-3 px-6 w-[153px] h-[50px]" 
          style={{ background: 'linear-gradient(90deg, #155DFC 0%, #1447E6 100%)' }}
          disabled={!hasChanges || isSaving}
        >
          {isSaving ? "Saving..." : "Save Model"}
        </Button>
      </div>
    </div>
  );
};

export default ModelView;

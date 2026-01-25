import { Badge } from "@/components/ui/badge";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { COMMON_VARIANTS, mobileBrands } from "@/constants/const";
import { Plus, Trash2, UploadCloud, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import toast from "react-hot-toast";
import { z } from "zod";
import { apiJson, jsonHeaders } from "@/lib/api";

// Zod Schema for form validation
const formSchema = z.object({
  category: z.string().min(1, "Category is required"),
  productImage: z.string().url("Invalid image URL").min(1, "Product image is required"),
  modelName: z.string().min(1, "Model name is required"),
  variants: z.record(
    z.string(),
    z.object({
      variant: z.string().min(1, "Variant name is required"),
      price: z.string().min(1, "Price is required"),
    })
  ).refine((variants) => Object.keys(variants).length > 0, {
    message: "At least one variant is required",
  }),
  modelCodes: z.array(z.string().min(1)).min(1, "At least one model code is required"),
});

type FormData = z.infer<typeof formSchema>;

const AddNewModel = () => {
  const urlParams = useParams();
  const navigate = useNavigate();
  const [brandData, setBrandData] = useState({
    name: "",
    logo: "",
  });

  // Form state
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      category: "",
      productImage: "",
      modelName: "",
      variants: {},
      modelCodes: [],
    },
  });

  // Dialog states
  const [isImageDialogOpen, setIsImageDialogOpen] = useState(false);
  const [currentImageUrl, setCurrentImageUrl] = useState("");
  const [newVariantName, setNewVariantName] = useState("");
  const [newVariantPrice, setNewVariantPrice] = useState("");
  const [newModelCode, setNewModelCode] = useState("");

  // Watch form values
  const productImage = watch("productImage");
  const variants = watch("variants");
  const modelCodes = watch("modelCodes");
  const category = watch("category");

  useEffect(() => {
    // Extract URL params
    const brandName = urlParams.brandId || "";
    const foundData = mobileBrands.find(
      (brand) => brand.name.toLowerCase() === brandName.toLowerCase(),
    );

    setBrandData(foundData || { name: "Unknown", logo: "" });
  }, [urlParams.brandId]);

  // Image handlers
  const handleAddImage = () => {
    if (currentImageUrl.trim()) {
      setValue("productImage", currentImageUrl.trim(), {
        shouldValidate: true,
      });
      setCurrentImageUrl("");
      setIsImageDialogOpen(false);
      toast.success("Image added successfully");
    }
  };

  const handleRemoveImage = () => {
    setValue("productImage", "", { shouldValidate: true });
    toast.success("Image removed");
  };

  // Variant handlers
  const handleAddVariant = () => {
    if (newVariantName && newVariantPrice) {
      const currentVariants = variants || {};
      const nextIndex = Object.keys(currentVariants).length;
      setValue(
        "variants",
        {
          ...currentVariants,
          [nextIndex]: {
            variant: newVariantName,
            price: newVariantPrice,
          },
        },
        { shouldValidate: true }
      );
      setNewVariantName("");
      setNewVariantPrice("");
      toast.success("Variant added");
    }
  };

  const handleRemoveVariant = (index: string) => {
    const currentVariants = variants || {};
    const newVariants = { ...currentVariants };
    delete newVariants[index];
    
    // Reindex variants
    const reindexedVariants: Record<string, { variant: string; price: string }> = {};
    Object.values(newVariants).forEach((variant: { variant: string; price: string }, idx: number) => {
      reindexedVariants[idx] = variant;
    });
    
    setValue("variants", reindexedVariants, { shouldValidate: true });
    toast.success("Variant removed");
  };

  // Model code handlers
  const handleAddModelCode = () => {
    if (newModelCode.trim()) {
      const currentCodes = modelCodes || [];
      if (!currentCodes.includes(newModelCode.trim())) {
        setValue("modelCodes", [...currentCodes, newModelCode.trim()], {
          shouldValidate: true,
        });
        setNewModelCode("");
        toast.success("Model code added");
      } else {
        toast.error("Model code already exists");
      }
    }
  };

  const handleRemoveModelCode = (code: string) => {
    const currentCodes = modelCodes || [];
    setValue(
      "modelCodes",
      currentCodes.filter((c: string) => c !== code),
      { shouldValidate: true }
    );
    toast.success("Model code removed");
  };

  // Form submission
  const onSubmit = async (data: FormData) => {
    try {
      const payload = {
        ...data,
        brand: urlParams.brandId || "",
      };

      const { response, data: result } = await apiJson<{
        success: boolean;
        message?: string;
        data?: any;
        error?: string;
        details?: Array<{ field: string; message: string }>;
      }>("/models/model/add", {
        method: "POST",
        headers: jsonHeaders,
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        // Handle validation errors
        if (result?.details && Array.isArray(result.details)) {
          result.details.forEach((err) => {
            toast.error(`${err.field}: ${err.message}`);
          });
          return;
        }

        toast.error(result?.error || "Failed to add model");
        return;
      }

      toast.success(result?.message || "Model added successfully!");
      
      // Navigate back to the brand models page after a short delay
      setTimeout(() => {
        navigate(`/model/${urlParams.brandId}`);
      }, 1000);
    } catch (error) {
      console.error("Error adding model:", error);
      toast.error("Failed to add model. Please try again.");
    }
  };

  const handleCancel = () => {
    // Reset form or navigate away
    window.history.back();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="mx-auto max-[600px]:px-4 px-10">
      {/* Image Upload Dialog */}
      <Dialog open={isImageDialogOpen} onOpenChange={setIsImageDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Product Image</DialogTitle>
            <DialogDescription>
              Enter the Smartprix URL for the model image
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Input
              value={currentImageUrl}
              onChange={(e) => setCurrentImageUrl(e.target.value)}
              placeholder="https://example.com/image.jpg"
              className="w-full"
              onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), handleAddImage())}
            />
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsImageDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button type="button" onClick={handleAddImage}>
              Add Image
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
            <h1 className="text-2xl font-bold">Add New Model</h1>
            <p className="text-gray-500 text-sm">
              Add new mobile model with complete specifications
            </p>
          </div>
        </div>
      </div>

      {/* Layer 2 - Category */}
      <Card className="px-5 mt-4 w-full rounded-[16px] border border-[#E2E8F0] py-4">
        <h2 className="text-base font-bold">Category</h2>
        <Select value={category} onValueChange={(value) => setValue("category", value, { shouldValidate: true })}>
          <SelectTrigger className="w-full -mt-2.5 mb-1">
            <SelectValue placeholder="e.g. Phone, Laptop and tablet" />
          </SelectTrigger>
          <SelectContent className="px-2 py-2">
            <SelectItem value="phone" className="hover:cursor-pointer">
              Phone
            </SelectItem>
            <SelectItem value="tablet" className="hover:cursor-pointer">
              Tablet
            </SelectItem>
            <SelectItem value="laptop" className="hover:cursor-pointer">
              Laptop
            </SelectItem>
          </SelectContent>
        </Select>
        {errors.category && (
          <p className="text-red-500 text-sm mt-1">{errors.category.message}</p>
        )}
      </Card>

      {/* Layer 3 - Product Images */}
      <Card className="px-5 mt-4 w-full rounded-[16px] border border-[#E2E8F0] pt-7 pb-7 flex flex-col gap-4">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold mb-4">Product Image</h2>
        </div>

        {/* Image Display */}
        <div className="w-full flex justify-center">
          {productImage ? (
            <Card className="w-64 h-80 rounded-[16px] border border-gray-200 bg-[#F3F3F3] flex items-center justify-center relative">
              <button
                type="button"
                onClick={handleRemoveImage}
                className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-1.5 z-10 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
              <img
                src={productImage}
                alt="Product"
                className="w-full h-full object-contain rounded-[16px]"
                onError={(e) => {
                  e.currentTarget.src = "https://via.placeholder.com/256x320?text=Invalid+Image";
                }}
              />
            </Card>
          ) : (
            <Card
              className="w-64 h-80 rounded-[16px] border border-gray-200 bg-[#F3F3F3] flex items-center justify-center cursor-pointer hover:bg-gray-200 transition-colors"
              onClick={() => setIsImageDialogOpen(true)}
            >
              <div className="group bg-white rounded-[18px] w-32 h-16 flex flex-col items-center justify-center pb-1.5 hover:bg-white/60 transition-colors duration-150 ease-in-out">
                <div className="bg-[#F1F1F1] border border-[#D7D7D7] rounded-full w-10 h-10 mb-1 flex items-center justify-center mx-auto mt-2">
                  <UploadCloud className="w-6 h-6" />
                </div>
                <p className="font-bold text-[9px] group-hover:text-black/80">
                  Upload a Mobile Image
                </p>
              </div>
            </Card>
          )}
        </div>
        {errors.productImage && (
          <p className="text-red-500 text-sm mt-2">{errors.productImage.message}</p>
        )}
      </Card>

      {/* Basic Information */}
      <Card className="px-5 mt-4 w-full rounded-[16px] border border-[#E2E8F0] py-4">
        <div className="flex justify-between items-center">
          <h2 className="text-base font-bold">Basic Information</h2>
        </div>
        <div className="mt-1">
          <span className="text-[#314158] text-sm">Model Name</span>
          <Input
            {...register("modelName")}
            className="h-[46px] font-inter mt-1.5 placeholder:px-4 text-[13px] text-[#0F172BA3] font-medium"
            placeholder="e.g. iPhone 14 Pro Max"
          />
          {errors.modelName && (
            <p className="text-red-500 text-sm mt-1">{errors.modelName.message}</p>
          )}
        </div>
      </Card>

      {/* Variant Information */}
      <Card className="px-5 mt-4 w-full rounded-[16px] border border-[#E2E8F0] py-4">
        <div className="flex justify-between items-center mt-4">
          <h2 className="text-base font-bold">
            Variants ({Object.keys(variants || {}).length})
          </h2>
        </div>

        {/* New Variants Addition */}
        <div className="mt-4">
          <span className="text-[#314158] text-sm">Add New Variants</span>
          <div className="flex gap-2 mt-1.5">
            <Select
              value={newVariantName}
              onValueChange={setNewVariantName}
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
            {newVariantName === "custom" && (
              <Input
                value=""
                onChange={(e) => setNewVariantName(e.target.value)}
                placeholder="Enter custom variant"
                className="flex-1"
                autoFocus
              />
            )}

            <Input
              value={newVariantPrice}
              onChange={(e) => setNewVariantPrice(e.target.value)}
              placeholder="e.g., ₹23,999 or 0"
              className="flex-1"
              onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), handleAddVariant())}
            />
            <Button type="button" onClick={handleAddVariant} size="sm">
              <Plus className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Existing Variants List */}
        {variants && Object.keys(variants).length > 0 && (
          <div className="mt-4 space-y-2">
            <span className="text-[#314158] text-sm font-medium">
              Existing Variants
            </span>
            <div className="space-y-2 mt-2">
              {Object.entries(variants).map(([key, variant]: [string, { variant: string; price: string }]) => (
                <div key={key} className="flex gap-2 items-center">
                  <Input
                    value={variant.variant}
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
                    onClick={() => handleRemoveVariant(key)}
                  />
                </div>
              ))}
            </div>
          </div>
        )}
        {errors.variants && (
          <p className="text-red-500 text-sm mt-2">{errors.variants.root?.message || "At least one variant is required"}</p>
        )}
      </Card>

      {/* Model Codes */}
      <Card className="px-5 mt-4 w-full rounded-[16px] border border-[#E2E8F0] py-4">
        <div className="flex justify-between items-center">
          <h2 className="text-base font-bold">
            Model Codes ({modelCodes?.length || 0})
          </h2>
        </div>

        {/* Add New Model Code */}
        <div className="mt-4">
          <span className="text-[#314158] text-sm">Add New Model Code</span>
          <div className="flex gap-2 mt-1.5">
            <Input
              value={newModelCode}
              onChange={(e) => setNewModelCode(e.target.value)}
              placeholder="Add new model code..."
              onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), handleAddModelCode())}
              className="flex-1"
            />
            <Button type="button" onClick={handleAddModelCode} size="sm">
              Add <Plus />
            </Button>
          </div>
        </div>

        {/* Existing Model Codes */}
        <div className="">
          <div className="flex flex-wrap gap-2 mt-2">
            {modelCodes && modelCodes.length > 0 ? (
              modelCodes.map((code: string, index: number) => (
                <div key={index} className="flex items-center">
                  <Badge
                    onClick={() => handleRemoveModelCode(code)}
                    variant="secondary"
                    className="px-3 py-3 border border-[#E2E8F0] text-[#0F172B80] bg-[#ffffff] group cursor-pointer hover:bg-red-50"
                  >
                    {code}
                    <Trash2 className="w-3 h-3 ml-2 text-red-500 cursor-pointer hover:text-red-700" />
                  </Badge>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground italic">
                No model codes available
              </p>
            )}
          </div>
        </div>
        {errors.modelCodes && (
          <p className="text-red-500 text-sm mt-2">{errors.modelCodes.message}</p>
        )}
      </Card>

      {/* Action Buttons */}
      <div className="my-20 flex justify-end gap-4 rounded-[34px]">
        <Button
          type="button"
          onClick={handleCancel}
          className="py-3 px-6 w-[153px] h-[50px]"
          variant="outline"
          disabled={isSubmitting}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          className="py-3 px-6 w-[153px] h-[50px]"
          style={{
            background: "linear-gradient(90deg, #155DFC 0%, #1447E6 100%)",
          }}
          disabled={isSubmitting}
        >
          {isSubmitting ? "Saving..." : "Save Model"}
        </Button>
      </div>
    </form>
  );
};

export default AddNewModel;



// {
//     "category": "phone",
//     "productImages": [
//         "https://cdn1.smartprix.com/rx-ioszWYUpm-w420-h420/realme-p4-power-5g.webp",
//         "https://www.smartprix.com/ui/img/specs/pd1g2rnb2hl?v=1t95jeq"
//     ],
//     "modelName": "Realme P4 Power 5G",
//     "variants": {
//         "0": {
//             "variant": "8 GB/128 GB",
//             "price": "0"
//         }
//     },
//     "modelCodes": [
//         "V2057"
//     ]
// }
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CalendarIcon, Check, ChevronsUpDown, Upload, UsersRound } from "lucide-react";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import toast from "react-hot-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar } from "@/components/ui/calendar";

const addEmployeeSchema = z.object({
  storeId: z.string().optional(),
  profilePicture: z.any().optional(),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters long"),
  phone: z.string().regex(/^\d{10}$/, "Phone number must be exactly 10 digits"),
  role: z.string().min(1, "Role is required"),
  aadharFront: z.any().optional(),
  aadharBack: z.any().optional(),
  aadharNumber: z.string().optional(),
  paymentType: z.string().min(1, "Payment type is required"),
  bankName: z.string().optional(),
  ifscCode: z.string().optional(),
  accountNumber: z.string().optional(),
  beneficiaryName: z.string().optional(),
  qualificationDocument: z.any().optional(),
  vehicleImageFront: z.any().optional(),
  vehicleImageBack: z.any().optional(),
  dateOfJoining: z.string().optional(),
  salary: z.string().optional(),
  incentive: z.string().optional(),
  payoutDate: z.string().optional(),
});

type AddEmployeeFormValues = z.infer<typeof addEmployeeSchema>;

const employeeLabelClassName =
  "[font-family:Inter] text-[13px] font-medium leading-[145%] tracking-[0] align-middle text-[#344054]";

const AddEmployee = () => {
  const [selectedProfileFileName, setSelectedProfileFileName] =
    useState("No file chosen");
  const [selectedAadharFrontFileName, setSelectedAadharFrontFileName] =
    useState("No file chosen");
  const [selectedAadharBackFileName, setSelectedAadharBackFileName] =
    useState("No file chosen");
  const [selectedQualificationFileName, setSelectedQualificationFileName] =
    useState("No file chosen");
  const [selectedVehicleImageFrontName, setSelectedVehicleImageFrontName] =
    useState("No file chosen");
  const [selectedVehicleImageBackName, setSelectedVehicleImageBackName] =
    useState("No file chosen");
  const [isStoreComboboxOpen, setIsStoreComboboxOpen] = useState(false);
  const [storeSearch, setStoreSearch] = useState("");
  const [isBankComboboxOpen, setIsBankComboboxOpen] = useState(false);
  const [bankSearch, setBankSearch] = useState("");
  const [beneficiaryName, setBeneficiaryName] = useState("");
  const [step, setStep] = useState(1);
  const [openPhoneVerifyDialog, setOpenPhoneVerifyDialog] = useState(false);
  const [aadharVerifyDialogOpen, setAadharVerifyDialogOpen] = useState(false);
  const form = useForm<AddEmployeeFormValues>({
    resolver: zodResolver(addEmployeeSchema),
    defaultValues: {
      storeId: "",
      profilePicture: undefined,
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      password: "",
      role: "",
      aadharFront: "",
      aadharBack: "",
      aadharNumber: "",
      paymentType: "bank-account",
      bankName: "",
      ifscCode: "",
      accountNumber: "",
      beneficiaryName: "",
      qualificationDocument: undefined,
      vehicleImageFront: undefined,
      vehicleImageBack: undefined,
      dateOfJoining: "",
      salary: "",
      incentive: "",
      payoutDate: "",
    },
  });

  const storeOptions = useMemo(
    () => [
      { label: "Store 101", value: "store-101" },
      { label: "Store 102", value: "store-102" },
      { label: "Store 103", value: "store-103" },
    ],
    [],
  );

  const filteredStoreOptions = useMemo(() => {
    const query = storeSearch.trim().toLowerCase();
    if (!query) {
      return storeOptions;
    }

    return storeOptions.filter((option) =>
      option.label.toLowerCase().includes(query),
    );
  }, [storeOptions, storeSearch]);

  const BANK_NAMES = [
    "AIRTEL PAYMENTS BANK",
    "AU SMALL FINANCE BANK",
    "AXIS BANK",
    "BANDHAN BANK",
    "BANK OF BARODA",
    "BANK OF INDIA",
    "BANK OF MAHARASHTRA",
    "CANARA BANK",
    "CATHOLIC SYRIAN BANK",
    "CENTRAL BANK OF INDIA",
    "CITY UNION BANK",
    "CSB BANK",
    "DCB BANK",
    "DHANLAXMI BANK",
    "EQUITAS SMALL FINANCE BANK",
    "FEDERAL BANK",
    "HDFC BANK",
    "ICICI BANK",
    "IDBI BANK",
    "IDFC FIRST BANK",
    "INDIA POST PAYMENTS BANK",
    "INDIAN BANK",
    "INDIAN OVERSEAS BANK",
    "INDUSIND BANK",
    "JANA SMALL FINANCE BANK",
    "KARNATAKA BANK",
    "KARUR VYSYA BANK",
    "KOTAK MAHINDRA BANK",
    "LAKSHMI VILAS BANK",
    "MEHSANA URBAN CO-OPERATIVE BANK",
    "NKGSB CO-OPERATIVE BANK",
    "PAYTM PAYMENTS BANK",
    "PUNJAB & SIND BANK",
    "PUNJAB NATIONAL BANK",
    "RBL BANK",
    "SARASWAT CO-OPERATIVE BANK",
    "SHAMRAO VITHAL CO-OPERATIVE BANK",
    "SOUTH INDIAN BANK",
    "STATE BANK OF INDIA",
    "SURYODAY SMALL FINANCE BANK",
    "TAMILNAD MERCANTILE BANK",
    "THE GUJARAT STATE CO-OPERATIVE BANK",
    "THE HALOL MERCANTILE CO-OPERATIVE BANK",
    "THE HOWRAH DISTRICT CENTRAL CO-OPERATIVE BANK",
    "THE JALGAON DISTRICT CENTRAL CO-OPERATIVE BANK",
    "THE KARNATAKA STATE CO-OPERATIVE APEX BANK",
    "THE MADURAI DISTRICT CENTRAL CO-OPERATIVE BANK",
    "THE MAGADH CENTRAL CO-OPERATIVE BANK",
    "THE MAHENDRAGARH CENTRAL CO-OPERATIVE BANK",
    "THE MAHOBA URBAN CO-OPERATIVE BANK",
    "THE MATTANCHERRY SARVAJANIK CO-OPERATIVE BANK",
    "THE MEENACHIL EAST URBAN CO-OPERATIVE BANK",
    "THE MUMBAI DISTRICT CENTRAL CO-OPERATIVE BANK",
    "THE MUZAFFARPUR CENTRAL CO-OPERATIVE BANK",
    "THE NAGPUR DISTRICT CENTRAL CO-OPERATIVE BANK",
    "THE NANDED DISTRICT CENTRAL CO-OPERATIVE BANK",
    "THE NATIONAL CO-OPERATIVE BANK",
    "THE NAVAL DOCKYARD CO-OPERATIVE BANK",
    "THE NAWANSHAHR CENTRAL CO-OPERATIVE BANK",
    "THE NILAMBUR CO-OPERATIVE URBAN BANK",
    "THE NILGIRIS DISTRICT CENTRAL CO-OPERATIVE BANK",
    "THE RAJASTHAN STATE CO-OPERATIVE BANK",
    "THE TAMILNADU STATE APEX CO-OPERATIVE BANK",
    "THE THIRUVANNAMALAI DISTRICT CENTRAL CO-OPERATIVE BANK",
    "THE VIRUDHUNAGAR DISTRICT CENTRAL CO-OPERATIVE BANK",
    "THE VISAKHAPATNAM CO-OPERATIVE BANK",
    "THE WEST BENGAL STATE CO-OPERATIVE BANK",
    "UCO BANK",
    "UJJIVAN SMALL FINANCE BANK",
    "UNION BANK OF INDIA",
    "VASAI JANATA SAHAKARI BANK",
    "YES BANK",
  ];

  const bankOptions = useMemo(
    () =>
      BANK_NAMES.map((bank) => ({
        label: bank,
        value: bank.toLowerCase().replace(/\s+/g, "-"),
      })),
    [],
  );

  const filteredBankOptions = useMemo(() => {
    const query = bankSearch.trim().toLowerCase();
    if (!query) {
      return bankOptions;
    }

    return bankOptions.filter((option) =>
      option.label.toLowerCase().includes(query),
    );
  }, [bankOptions, bankSearch]);

  const onSubmit = (values: AddEmployeeFormValues) => {
    console.log("Add employee form values:", values);
  };

  return (
    <div className="px-6 py-6">
      <div className="flex items-center justify-between gap-4 mb-6 max-[550px]:flex-col max-[550px]:items-start">
        {/* User Icon with gradient background */}
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-linear-to-br from-[#7F22FE] to-[#7008E7] flex items-center justify-center">
            <UsersRound className="w-6 h-6 text-white" />
          </div>

          {/* Title and subtitle */}
          <div className="flex flex-col">
            <h1 className="text-2xl font-bold">Add New Employees</h1>
            <p className="text-[#62748E] text-base font-normal">
              Complete the form to register a new employee
            </p>
          </div>
        </div>
      </div>

      <div className="mt-10 flex flex-col gap-6 xl:flex-row xl:gap-3">
        <div className="w-full min-w-0 rounded-[10px] border border-[#E4E7EC] bg-[#FFFFFF] pt-8 px-6 pb-6 xl:w-139.5">
          {/* Form 1 */}
          {step === 1 && (
            <div className="p-6 flex flex-col ">
              <div className="flex flex-col gap-1 items-center">
                <h2 className="text-2xl font-semibold text-[#1A1A21]">
                  Personal Details
                </h2>
                <p className="text-[#8C94A6] font-normal text-base">
                  Fill out these details to Add New Employees{" "}
                </p>
              </div>

              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit(onSubmit)}
                  className="mt-10 space-y-6"
                >
                  <FormField
                    control={form.control}
                    name="storeId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className={employeeLabelClassName}>
                          Assign Store (Optional)
                        </FormLabel>
                        <FormControl>
                          <Popover
                            open={isStoreComboboxOpen}
                            onOpenChange={(isOpen) => {
                              setIsStoreComboboxOpen(isOpen);
                              if (!isOpen) {
                                setStoreSearch("");
                              }
                            }}
                          >
                            <PopoverTrigger asChild>
                              <Button
                                type="button"
                                variant="outline"
                                role="combobox"
                                aria-expanded={isStoreComboboxOpen}
                                className="h-14 w-full max-w-127.5 justify-between gap-3 rounded-[6px] border border-[#D0D5DD] px-4 py-4 font-normal"
                              >
                                <span
                                  className={
                                    field.value
                                      ? "text-[#101828]"
                                      : "text-[#98A2B3]"
                                  }
                                >
                                  {storeOptions.find(
                                    (option) => option.value === field.value,
                                  )?.label ?? "Select store"}
                                </span>
                                <ChevronsUpDown className="h-4 w-4 text-[#667085]" />
                              </Button>
                            </PopoverTrigger>

                            <PopoverContent
                              className="w-127.5 max-w-[calc(100vw-48px)] p-2 rounded-[10px]"
                              align="start"
                            >
                              <Input
                                value={storeSearch}
                                onChange={(event) =>
                                  setStoreSearch(event.target.value)
                                }
                                placeholder="Search store"
                                className="h-10 border-[#D0D5DD]"
                              />

                              <div className="mt-2 max-h-56 space-y-1 overflow-y-auto">
                                <button
                                  type="button"
                                  onClick={() => {
                                    field.onChange("");
                                    setIsStoreComboboxOpen(false);
                                    setStoreSearch("");
                                  }}
                                  className="flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-sm text-[#667085] hover:bg-[#F2F4F7]"
                                >
                                  <span>None</span>
                                  {!field.value && (
                                    <Check className="h-4 w-4" />
                                  )}
                                </button>

                                {filteredStoreOptions.length > 0 ? (
                                  filteredStoreOptions.map((option) => (
                                    <button
                                      key={option.value}
                                      type="button"
                                      onClick={() => {
                                        field.onChange(option.value);
                                        setIsStoreComboboxOpen(false);
                                        setStoreSearch("");
                                      }}
                                      className="flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-sm text-[#101828] hover:bg-[#F2F4F7]"
                                    >
                                      <span>{option.label}</span>
                                      {field.value === option.value && (
                                        <Check className="h-4 w-4" />
                                      )}
                                    </button>
                                  ))
                                ) : (
                                  <p className="px-3 py-2 text-sm text-[#98A2B3]">
                                    No stores found
                                  </p>
                                )}
                              </div>
                            </PopoverContent>
                          </Popover>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="profilePicture"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className={employeeLabelClassName}>
                          Profile picture
                        </FormLabel>
                        <FormControl>
                          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
                            <div className="h-12.5 w-12.5 shrink-0 rounded-full bg-[#F2F4F7] flex items-center justify-center self-start sm:self-auto">
                              <Upload className="h-4.5 w-4.5 text-[#667085]" />
                            </div>

                            <div className="flex w-full min-w-0 flex-col gap-3 rounded-[6px] border border-[#D0D5DD] bg-white px-4 py-4 box-border sm:h-12.75 sm:flex-row sm:items-center sm:justify-between sm:py-5.5">
                              <div className="flex min-w-0 items-center gap-3">
                                <label
                                  htmlFor="employee-profile-picture"
                                  className="inline-flex cursor-pointer items-center rounded-xl border-none py-2 text-sm font-medium text-[#344054] hover:bg-[#F2F4F7] sm:pl-3"
                                >
                                  Choose file
                                </label>
                                <p className="truncate text-sm text-[#98A2B3]">
                                  {selectedProfileFileName}
                                </p>
                              </div>
                              <Button
                                type="button"
                                className="h-9 w-full rounded-[10px] bg-[#336AEA] px-6 text-white hover:bg-[#2958CA] sm:w-auto"
                              >
                                Upload
                              </Button>

                              <input
                                id="employee-profile-picture"
                                type="file"
                                accept="image/png,image/jpeg"
                                className="hidden"
                                onChange={(event) => {
                                  const file = event.target.files?.[0];
                                  setSelectedProfileFileName(
                                    file?.name ?? "No file chosen",
                                  );
                                  field.onChange(file ?? undefined);
                                }}
                              />
                            </div>
                          </div>
                        </FormControl>
                        <p className="text-xs text-[#667185]">
                          Max size: 5MB. Supported formats: JPG, PNG
                        </p>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="firstName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className={employeeLabelClassName}>
                            First Name
                          </FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              placeholder="Rahul"
                              className="h-14 w-full max-w-61.5 rounded-[6px] border border-[#D0D5DD] px-4 py-4 text-base text-[#101828] placeholder:text-[#98A2B3]"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="lastName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className={employeeLabelClassName}>
                            Last Name
                          </FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              placeholder="Kumar"
                              className="h-14 w-full max-w-61.5 rounded-[6px] border border-[#D0D5DD] px-4 py-4 text-base text-[#101828] placeholder:text-[#98A2B3]"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className={employeeLabelClassName}>
                          Email Address
                        </FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            type="email"
                            placeholder="Ahne1234@gmail.com"
                            className="h-14 w-full max-w-127.5 rounded-[6px] border border-[#D0D5DD] px-4 py-4 text-base text-[#101828] placeholder:text-[#98A2B3]"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className={employeeLabelClassName}>
                          Phone Number
                        </FormLabel>
                        <FormControl>
                          <div className="flex h-14 w-full max-w-127.5 items-center gap-3 rounded-[6px] border border-[#D0D5DD] bg-white px-4 py-4 box-border">
                            <Input
                              {...field}
                              placeholder="Enter 10-digit phone number"
                              inputMode="numeric"
                              maxLength={10}
                              className="h-full flex-1 border-0 p-0 text-base text-[#101828] shadow-none placeholder:text-[#98A2B3] focus-visible:ring-0"
                              onChange={(event) => {
                                const digitsOnly = event.target.value.replace(
                                  /\D/g,
                                  "",
                                );
                                field.onChange(digitsOnly);
                              }}
                            />

                            <Button
                              type="button"
                              onClick={() => {
                                let phone = form.getValues().phone;
                                if (phone.length < 10) {
                                  toast.error(
                                    `Please enter a valid phone number`,
                                  );
                                } else setOpenPhoneVerifyDialog(true);
                              }}
                              className="h-9 rounded-[10px] border border-[#33ea5b] bg-[#00C950] px-4 text-sm font-semibold text-white hover:bg-[#29ca4c]"
                            >
                              Verify
                            </Button>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Dialog
                    open={openPhoneVerifyDialog}
                    onOpenChange={setOpenPhoneVerifyDialog}
                  >
                    <DialogContent className="sm:max-w-139.5 sm:max-h-97 rounded-[10px] gap-8">
                      <DialogHeader>
                        <DialogTitle className="text-2xl font-semibold text-[#1A1A21] text-center">
                          Mobile No. Verification
                        </DialogTitle>

                        <DialogDescription className="text-center  text-[#8C94A6] font-normal text-base">
                          Please enter the OTP sent to your phone number.
                        </DialogDescription>
                      </DialogHeader>

                      <div className="flex flex-col w-123.25 items-center gap-5">
                        <div className=" flex  gap-3 justify-center">
                          <Input
                            placeholder=""
                            className="h-16.75 w-17 rounded-[6px] border border-[#D0D5DD] p-4"
                          />
                          <Input
                            placeholder=""
                            className="h-16.75 w-17 rounded-[6px] border border-[#D0D5DD] p-4"
                          />
                          <Input
                            placeholder=""
                            className="h-16.75 w-17 rounded-[6px] border border-[#D0D5DD] p-4"
                          />
                          <Input
                            placeholder=""
                            className="h-16.75 w-17 rounded-[6px] border border-[#D0D5DD] p-4"
                          />
                          <Input
                            placeholder=""
                            className="h-16.75 w-17 rounded-[6px] border border-[#D0D5DD] p-4"
                          />
                          <Input
                            placeholder=""
                            className="h-16.75 w-17 rounded-[6px] border border-[#D0D5DD] p-4"
                          />
                        </div>

                        <div className="flex flex-col items-center gap-2.5">
                          <span className="text-[#7B7D86] font-semibold text-xs">
                            Didn't receive a code? Check SMS
                          </span>
                          <button className="hover:cursor-pointer bg-[#0A0A0A] py-2 px-4 rounded-[6px] w-20 h-8 text-[8px] font-semibold text-white hover:bg-[#1A1A21]">
                            Resend OTP
                          </button>
                        </div>

                        <div className="w-127.5 border border-[#E9E9E9]" />

                        <Button className="bg-[#00C950] py-2 mb-4 px-4 rounded-xl w-73.5 h-9 hover:bg-[#29ca4c] text-sm font-semibold text-white">
                          Verify
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>

                  <div className="border-t border-[#EAECF0] pt-6">
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <Button
                        type="button"
                        variant="outline"
                        disabled={step === 1}
                        style={{
                          width: 220,
                          height: 48,
                          gap: 10,
                          borderRadius: 8,
                          borderWidth: 1.5,
                          paddingTop: 16,
                          paddingRight: 24,
                          paddingBottom: 16,
                          paddingLeft: 24,
                        }}
                        className={`border-[#101828] bg-white text-lg font-semibold text-[#101828] hover:bg-[#F9FAFB] ${step === 1 ? "cursor-not-allowed opacity-50" : ""}`}
                      >
                        Previous
                      </Button>
                      <Button
                        type="button"
                        onClick={() => setStep(2)}
                        style={{
                          width: 220,
                          height: 48,
                          gap: 10,
                          borderRadius: 8,
                          borderWidth: 1.5,
                          paddingTop: 16,
                          paddingRight: 24,
                          paddingBottom: 16,
                          paddingLeft: 24,
                        }}
                        className="bg-[#336AEA] text-lg font-semibold text-white hover:bg-[#2958CA]"
                      >
                        Next Step
                      </Button>
                    </div>
                  </div>
                </form>
              </Form>
            </div>
          )}
          {/* Form 2 */}
          {step === 2 && (
            <div className="p-6 flex flex-col ">
              <div className="flex flex-col gap-1 items-center">
                <h2 className="text-2xl font-semibold text-[#1A1A21]">
                  Role & Password
                </h2>
                <p className="text-[#8C94A6] font-normal text-base">
                  Fill out these details to Add new employees{" "}
                </p>
              </div>

              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit(onSubmit)}
                  className="mt-10 space-y-6"
                >
                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className={employeeLabelClassName}>
                          Password
                        </FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            type="password"
                            placeholder="Enter to password"
                            className="h-14 w-full max-w-127.5 rounded-[6px] border border-[#D0D5DD] px-4 py-4 text-base text-[#101828] placeholder:text-[#98A2B3]"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="role"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className={employeeLabelClassName}>
                          Role type
                        </FormLabel>
                        <FormControl>
                          <div className="flex h-14 w-full max-w-127.5 items-center gap-3 rounded-[6px] border border-[#D0D5DD] bg-white px-2 py-4 box-border">
                            <Select
                              value={field.value}
                              onValueChange={field.onChange}
                            >
                              <SelectTrigger className="w-full border-none outline-none shadow-none">
                                <SelectValue placeholder="Select role" />
                              </SelectTrigger>

                              <SelectContent
                                className="w-full max-w-127.5 rounded-[10px] border border-[#D0D5DD] px-4 py-2"
                                position="popper"
                              >
                                <SelectItem value="admin">Admin</SelectItem>
                                <SelectItem value="field-executive">
                                  Field Executive
                                </SelectItem>
                                <SelectItem value="sales-agent">
                                  Sales Agent
                                </SelectItem>
                                <SelectItem value="store-manager">
                                  Store Manager
                                </SelectItem>
                                <SelectItem value="technician">
                                  Technician
                                </SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="border-t border-[#EAECF0] pt-6">
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setStep(1)}
                        style={{
                          width: 220,
                          height: 48,
                          gap: 10,
                          borderRadius: 8,
                          borderWidth: 1.5,
                          paddingTop: 16,
                          paddingRight: 24,
                          paddingBottom: 16,
                          paddingLeft: 24,
                        }}
                        className="border-[#101828] bg-white text-lg font-semibold text-[#101828] hover:bg-[#F9FAFB]"
                      >
                        Previous
                      </Button>
                      <Button
                        type="button"
                        onClick={() => setStep(3)}
                        style={{
                          width: 220,
                          height: 48,
                          gap: 10,
                          borderRadius: 8,
                          borderWidth: 1.5,
                          paddingTop: 16,
                          paddingRight: 24,
                          paddingBottom: 16,
                          paddingLeft: 24,
                        }}
                        className="bg-[#336AEA] text-lg font-semibold text-white hover:bg-[#2958CA]"
                      >
                        Next Step
                      </Button>
                    </div>
                  </div>
                </form>
              </Form>
            </div>
          )}
          {/* Form 3 */}
          {step === 3 && (
            <div className="p-6 flex flex-col ">
              <div className="flex flex-col gap-1 items-center">
                <h2 className="text-2xl font-semibold text-[#1A1A21]">
                  KYC Verification
                </h2>
                <p className="text-[#8C94A6] font-normal text-base">
                  Fill out these details for verifying KYC
                </p>
              </div>

              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit(onSubmit)}
                  className="mt-10 space-y-6"
                >
                  <FormField
                    control={form.control}
                    name="aadharFront"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className={employeeLabelClassName}>
                          Aadhar Front
                        </FormLabel>
                        <FormControl>
                          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
                            <div className="h-12.5 w-12.5 shrink-0 rounded-full bg-[#F2F4F7] flex items-center justify-center self-start sm:self-auto">
                              <Upload className="h-4.5 w-4.5 text-[#667085]" />
                            </div>

                            <div className="flex w-full min-w-0 flex-col gap-3 rounded-[6px] border border-[#D0D5DD] bg-white px-4 py-4 box-border sm:h-12.75 sm:flex-row sm:items-center sm:justify-between sm:py-5.5">
                              <div className="flex min-w-0 items-center gap-3">
                                <label
                                  htmlFor="employee-aadhar-front"
                                  className="inline-flex cursor-pointer items-center rounded-xl border-none py-2 text-sm font-medium text-[#344054] hover:bg-[#F2F4F7] sm:pl-3"
                                >
                                  Choose file
                                </label>
                                <p className="truncate text-sm text-[#98A2B3]">
                                  {selectedAadharFrontFileName}
                                </p>
                              </div>
                              <Button
                                ref={field.ref}
                                onClick={() => {
                                  document
                                    .getElementById("employee-aadhar-front")
                                    ?.click();
                                }}
                                type="button"
                                className="h-9 w-full rounded-[10px] bg-[#336AEA] px-6 text-white hover:bg-[#2958CA] sm:w-auto"
                              >
                                Upload
                              </Button>

                              <input
                                id="employee-aadhar-front"
                                type="file"
                                accept="image/png,image/jpeg"
                                className="hidden"
                                onChange={(event) => {
                                  const file = event.target.files?.[0];
                                  setSelectedAadharFrontFileName(
                                    file?.name ?? "No file chosen",
                                  );
                                  field.onChange(file ?? undefined);
                                }}
                              />
                            </div>
                          </div>
                        </FormControl>
                        <p className="text-xs text-[#667185]">
                          Max size: 5MB. Supported formats: JPG, PNG
                        </p>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="aadharBack"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className={employeeLabelClassName}>
                          Aadhar Back
                        </FormLabel>
                        <FormControl>
                          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
                            <div className="h-12.5 w-12.5 shrink-0 rounded-full bg-[#F2F4F7] flex items-center justify-center self-start sm:self-auto">
                              <Upload className="h-4.5 w-4.5 text-[#667085]" />
                            </div>

                            <div className="flex w-full min-w-0 flex-col gap-3 rounded-[6px] border border-[#D0D5DD] bg-white px-4 py-4 box-border sm:h-12.75 sm:flex-row sm:items-center sm:justify-between sm:py-5.5">
                              <div className="flex min-w-0 items-center gap-3">
                                <label
                                  htmlFor="employee-aadhar-back"
                                  className="inline-flex cursor-pointer items-center rounded-xl border-none py-2 text-sm font-medium text-[#344054] hover:bg-[#F2F4F7] sm:pl-3"
                                >
                                  Choose file
                                </label>
                                <p className="truncate text-sm text-[#98A2B3]">
                                  {selectedAadharBackFileName}
                                </p>
                              </div>
                              <Button
                                ref={field.ref}
                                onClick={() => {
                                  document
                                    .getElementById("employee-aadhar-back")
                                    ?.click();
                                }}
                                type="button"
                                className="h-9 w-full rounded-[10px] bg-[#336AEA] px-6 text-white hover:bg-[#2958CA] sm:w-auto"
                              >
                                Upload
                              </Button>

                              <input
                                id="employee-aadhar-back"
                                type="file"
                                accept="image/png,image/jpeg"
                                className="hidden"
                                onChange={(event) => {
                                  const file = event.target.files?.[0];
                                  setSelectedAadharBackFileName(
                                    file?.name ?? "No file chosen",
                                  );
                                  field.onChange(file ?? undefined);
                                }}
                              />
                            </div>
                          </div>
                        </FormControl>
                        <p className="text-xs text-[#667185]">
                          Max size: 5MB. Supported formats: JPG, PNG
                        </p>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="mt-10 mb-20 flex justify-center">
                    <button
                      onClick={() => {
                        let aFrt = form.getValues().aadharFront;
                        let aBck = form.getValues().aadharBack;

                        if (!aFrt) {
                          toast.error("Please upload  Aadhar Front image.");
                          return;
                        } else if (!aBck) {
                          toast.error("Please upload Aadhar Back image.");
                          return;
                        }

                        setAadharVerifyDialogOpen(true);
                      }}
                      className="w-73.5 h-9 bg-[#00c950] hover:bg-[#29ca4c] text-sm font-semibold text-white rounded-xl"
                    >
                      Verify
                    </button>
                  </div>

                  <Dialog
                    open={aadharVerifyDialogOpen}
                    onOpenChange={setAadharVerifyDialogOpen}
                  >
                    <DialogContent className="sm:max-w-139.5 sm:max-h-97 rounded-[10px] gap-8">
                      <DialogHeader>
                        <DialogTitle className="text-2xl font-semibold text-[#1A1A21] text-center">
                          Verify Aadhar
                        </DialogTitle>
                        <DialogDescription className="text-center  text-[#8C94A6] font-normal text-base">
                          Please enter aadhar number for verification
                        </DialogDescription>
                      </DialogHeader>

                      <div className="flex w-123.25 flex-col items-center gap-5">
                        <FormField
                          control={form.control}
                          name="aadharNumber"
                          render={({ field }) => (
                            <FormItem className="w-full">
                              <FormLabel className={employeeLabelClassName}>
                                Aadhaar Number
                              </FormLabel>
                              <FormControl>
                                <Input
                                  {...field}
                                  placeholder="Enter 12-digit Aadhaar number"
                                  inputMode="numeric"
                                  maxLength={12}
                                  className="h-14 w-full rounded-[6px] border border-[#D0D5DD] px-4 py-4 text-base text-[#101828] placeholder:text-[#98A2B3]"
                                  onChange={(event) => {
                                    const digitsOnly =
                                      event.target.value.replace(/\D/g, "");
                                    field.onChange(digitsOnly);
                                  }}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <Button
                          type="button"
                          onClick={() => {
                            const aadharNumber =
                              form.getValues().aadharNumber ?? "";
                            if (aadharNumber.length !== 12) {
                              toast.error(
                                "Please enter a valid 12-digit Aadhaar number.",
                              );
                              return;
                            }
                            toast.success("Aadhaar verified successfully.");
                            setAadharVerifyDialogOpen(false);
                          }}
                          className="w-73.5 h-9 bg-[#00c950] text-sm font-semibold text-white hover:bg-[#29ca4c] my-4"
                        >
                          Next
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>

                  <div className="border-t border-[#EAECF0] pt-6">
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setStep(2)}
                        style={{
                          width: 220,
                          height: 48,
                          gap: 10,
                          borderRadius: 8,
                          borderWidth: 1.5,
                          paddingTop: 16,
                          paddingRight: 24,
                          paddingBottom: 16,
                          paddingLeft: 24,
                        }}
                        className="border-[#101828] bg-white text-lg font-semibold text-[#101828] hover:bg-[#F9FAFB]"
                      >
                        Previous
                      </Button>
                      <Button
                        type="button"
                        onClick={() => setStep(4)}
                        style={{
                          width: 220,
                          height: 48,
                          gap: 10,
                          borderRadius: 8,
                          borderWidth: 1.5,
                          paddingTop: 16,
                          paddingRight: 24,
                          paddingBottom: 16,
                          paddingLeft: 24,
                        }}
                        className="bg-[#336AEA] text-lg font-semibold text-white hover:bg-[#2958CA]"
                      >
                        Next Step
                      </Button>
                    </div>
                  </div>
                </form>
              </Form>
            </div>
          )}
          {/* Form 4 */}
          {step === 4 && (
            <div className="p-6 flex flex-col ">
              <div className="flex flex-col gap-1 items-center">
                <h2 className="text-2xl font-semibold text-[#1A1A21]">
                  Bank & Documents
                </h2>
                <p className="text-[#8C94A6] font-normal text-base">
                  Fill out these details for bank and document verification
                </p>
              </div>

              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit(onSubmit)}
                  className="mt-10 space-y-6"
                >
                  <FormField
                    control={form.control}
                    name="paymentType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className={employeeLabelClassName}>
                          Payment Type
                        </FormLabel>
                        <FormControl>
                          <>
                            <div className="my-4 bg-[#EAEAEA] md:h-16 h-36 rounded-[6px] flex items-center justify-center px-2">
                              <Tabs
                                value={field.value || "bank-account"}
                                onValueChange={field.onChange}
                                className="w-full h-full"
                              >
                                <TabsList className="grid h-full w-full grid-cols-1 gap-2 rounded-[6px] bg-[#EAEAEA] sm:grid-cols-2 sm:gap-3">
                                  <TabsTrigger
                                    value="bank-account"
                                    className="h-auto rounded-[6px] bg-[#336AEA] px-3 py-3 text-sm font-semibold data-[state=active]:bg-[#336AEA] data-[state=active]:opacity-60 flex flex-col items-center justify-center gap-0.5 sm:h-14"
                                  >
                                    <span className="text-sm font-semibold text-white sm:text-base">
                                      Bank Account
                                    </span>
                                    <p className="text-[11px] text-[#FFFFFF] font-light sm:text-xs">
                                      Add bank account details
                                    </p>
                                  </TabsTrigger>
                                  <TabsTrigger
                                    value="upi"
                                    className="h-auto rounded-[6px] bg-[#00C950] px-3 py-3 text-sm font-semibold data-[state=active]:bg-[#00C950] data-[state=active]:opacity-60 data-[state=active]:text-white flex flex-col items-center justify-center gap-0.5 sm:h-14"
                                  >
                                    <span className="text-sm font-semibold text-white sm:text-base">
                                      UPI
                                    </span>
                                    <p className="text-[11px] text-[#FFFFFF] font-light sm:text-xs">
                                      Add UPI details
                                    </p>
                                  </TabsTrigger>
                                </TabsList>
                              </Tabs>
                            </div>
                            <span className="text-xs text-[#667185] -my-1 ">
                              Note: Salary will be credited in the selected
                              payment method
                            </span>
                          </>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {form.watch("paymentType") === "bank-account" && (
                    <div className="space-y-6">
                      <FormField
                        control={form.control}
                        name="bankName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className={employeeLabelClassName}>
                              Bank Name
                            </FormLabel>
                            <FormControl>
                              <Popover
                                open={isBankComboboxOpen}
                                onOpenChange={(isOpen) => {
                                  setIsBankComboboxOpen(isOpen);
                                  if (!isOpen) {
                                    setBankSearch("");
                                  }
                                }}
                              >
                                <PopoverTrigger asChild>
                                  <Button
                                    type="button"
                                    variant="outline"
                                    role="combobox"
                                    aria-expanded={isBankComboboxOpen}
                                    className="h-14 w-full max-w-127.5 justify-between gap-3 rounded-[6px] border border-[#D0D5DD] px-4 py-4 font-normal"
                                  >
                                    <span
                                      className={
                                        field.value
                                          ? "text-[#101828]"
                                          : "text-[#98A2B3]"
                                      }
                                    >
                                      {bankOptions.find(
                                        (option) =>
                                          option.value === field.value,
                                      )?.label ?? "Select bank"}
                                    </span>
                                    <ChevronsUpDown className="h-4 w-4 text-[#667085]" />
                                  </Button>
                                </PopoverTrigger>

                                <PopoverContent
                                  className="w-127.5 max-w-[calc(100vw-48px)] p-2 rounded-[10px]"
                                  align="start"
                                >
                                  <Input
                                    value={bankSearch}
                                    onChange={(event) =>
                                      setBankSearch(event.target.value)
                                    }
                                    placeholder="Search bank"
                                    className="h-10 border-[#D0D5DD]"
                                  />

                                  <div className="mt-2 max-h-56 space-y-1 overflow-y-auto">
                                    {filteredBankOptions.length > 0 ? (
                                      filteredBankOptions.map((option) => (
                                        <button
                                          key={option.value}
                                          type="button"
                                          onClick={() => {
                                            field.onChange(option.value);
                                            setIsBankComboboxOpen(false);
                                            setBankSearch("");
                                          }}
                                          className="flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-sm text-[#101828] hover:bg-[#F2F4F7]"
                                        >
                                          <span>{option.label}</span>
                                          {field.value === option.value && (
                                            <Check className="h-4 w-4" />
                                          )}
                                        </button>
                                      ))
                                    ) : (
                                      <p className="px-3 py-2 text-sm text-[#98A2B3]">
                                        No banks found
                                      </p>
                                    )}
                                  </div>
                                </PopoverContent>
                              </Popover>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="ifscCode"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className={employeeLabelClassName}>
                              IFSC Code
                            </FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                placeholder="Enter IFSC code"
                                className="h-14 w-full max-w-127.5 rounded-[6px] border border-[#D0D5DD] px-4 py-4 text-base text-[#101828] placeholder:text-[#98A2B3] uppercase"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="accountNumber"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className={employeeLabelClassName}>
                              Account Number
                            </FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                placeholder="Enter account number"
                                className="h-14 w-full max-w-127.5 rounded-[6px] border border-[#D0D5DD] px-4 py-4 text-base text-[#101828] placeholder:text-[#98A2B3]"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="flex justify-center mt-4">
                        <Button
                          type="button"
                          onClick={() => {
                            const bankName = form.getValues().bankName;
                            const ifscCode = form.getValues().ifscCode;
                            const accountNumber =
                              form.getValues().accountNumber;

                            if (!bankName) {
                              toast.error("Please select a bank");
                              return;
                            }
                            if (!ifscCode) {
                              toast.error("Please enter IFSC code");
                              return;
                            }
                            if (!accountNumber) {
                              toast.error("Please enter account number");
                              return;
                            }

                            // Simulate verification
                            setBeneficiaryName("Rahul Kumar");
                            toast.success("Bank details verified successfully");
                          }}
                          className="h-9 w-73  rounded-[10px] bg-[#00C950] px-6 text-sm font-semibold text-white hover:bg-[#29ca4c]"
                        >
                          Verify
                        </Button>
                      </div>

                      {beneficiaryName && (
                        <FormField
                          control={form.control}
                          name="beneficiaryName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className={employeeLabelClassName}>
                                Beneficiary Name
                              </FormLabel>
                              <FormControl>
                                <Input
                                  {...field}
                                  value={beneficiaryName}
                                  readOnly
                                  className="h-14 w-full max-w-127.5 rounded-[6px] border border-[#D0D5DD] px-4 py-4 text-base text-[#101828] bg-[#F2F4F7] cursor-not-allowed"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      )}
                    </div>
                  )}

                  {form.watch("paymentType") === "upi" && (
                    <div className="space-y-6">
                      <FormField
                        control={form.control}
                        name="aadharNumber"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className={employeeLabelClassName}>
                              UPI ID / Number
                            </FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                placeholder="Enter UPI ID (e.g. name@bank)"
                                className="h-14 w-full max-w-127.5 rounded-[6px] border border-[#D0D5DD] px-4 py-4 text-base text-[#101828] placeholder:text-[#98A2B3]"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="flex justify-center mt-4">
                        <Button
                          type="button"
                          onClick={() => {
                            const upiId = form.getValues().aadharNumber;

                            if (!upiId) {
                              toast.error("Please enter UPI ID");
                              return;
                            }

                            // Simulate verification
                            setBeneficiaryName("Rahul Kumar");
                            toast.success("UPI details verified successfully");
                          }}
                          className="h-9 w-73 rounded-[10px] bg-[#00C950] px-6 text-sm font-semibold text-white hover:bg-[#29ca4c]"
                        >
                          Verify
                        </Button>
                      </div>

                      {beneficiaryName && (
                        <FormField
                          control={form.control}
                          name="beneficiaryName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className={employeeLabelClassName}>
                                Beneficiary Name
                              </FormLabel>
                              <FormControl>
                                <Input
                                  {...field}
                                  value={beneficiaryName}
                                  readOnly
                                  className="h-14 w-full max-w-127.5 rounded-[6px] border border-[#D0D5DD] px-4 py-4 text-base text-[#101828] bg-[#F2F4F7] cursor-not-allowed"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      )}
                    </div>
                  )}

                 <div className="flex flex-col my-10 gap-8">
                   <FormField
                    control={form.control}
                    name="qualificationDocument"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className={employeeLabelClassName}>
                          Qualification Document
                        </FormLabel>
                        <FormControl>
                          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
                            <div className="h-12.5 w-12.5 shrink-0 rounded-full bg-[#F2F4F7] flex items-center justify-center self-start sm:self-auto">
                              <Upload className="h-4.5 w-4.5 text-[#667085]" />
                            </div>

                            <div className="flex w-full min-w-0 flex-col gap-3 rounded-[6px] border border-[#D0D5DD] bg-white px-4 py-4 box-border sm:h-12.75 sm:flex-row sm:items-center sm:justify-between sm:py-5.5">
                              <div className="flex min-w-0 items-center gap-3">
                                <label
                                  htmlFor="employee-qualification-document"
                                  className="inline-flex cursor-pointer items-center rounded-xl border-none py-2 text-sm font-medium text-[#344054] hover:bg-[#F2F4F7] sm:pl-3"
                                >
                                  Choose file
                                </label>
                                <p className="truncate text-sm text-[#98A2B3]">
                                  {selectedQualificationFileName}
                                </p>
                              </div>
                              <Button
                                ref={field.ref}
                                onClick={() => {
                                  document
                                    .getElementById(
                                      "employee-qualification-document",
                                    )
                                    ?.click();
                                }}
                                type="button"
                                className="h-9 w-full rounded-[10px] bg-[#336AEA] px-6 text-white hover:bg-[#2958CA] sm:w-auto"
                              >
                                Upload
                              </Button>

                              <input
                                id="employee-qualification-document"
                                type="file"
                                accept="image/png,image/jpeg"
                                className="hidden"
                                onChange={(event) => {
                                  const file = event.target.files?.[0];
                                  setSelectedQualificationFileName(
                                    file?.name ?? "No file chosen",
                                  );
                                  field.onChange(file ?? undefined);
                                }}
                              />
                            </div>
                          </div>
                        </FormControl>
                        <p className="text-xs text-[#667185]">
                          Max size: 5MB. Supported formats: JPG, PNG
                        </p>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="vehicleImageFront"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className={employeeLabelClassName}>
                          Vehicle Image (Front)
                        </FormLabel>
                        <FormControl>
                          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
                            <div className="h-12.5 w-12.5 shrink-0 rounded-full bg-[#F2F4F7] flex items-center justify-center self-start sm:self-auto">
                              <Upload className="h-4.5 w-4.5 text-[#667085]" />
                            </div>

                            <div className="flex w-full min-w-0 flex-col gap-3 rounded-[6px] border border-[#D0D5DD] bg-white px-4 py-4 box-border sm:h-12.75 sm:flex-row sm:items-center sm:justify-between sm:py-5.5">
                              <div className="flex min-w-0 items-center gap-3">
                                <label
                                  htmlFor="employee-vehicle-image-front"
                                  className="inline-flex cursor-pointer items-center rounded-xl border-none py-2 text-sm font-medium text-[#344054] hover:bg-[#F2F4F7] sm:pl-3"
                                >
                                  Choose file
                                </label>
                                <p className="truncate text-sm text-[#98A2B3]">
                                  {selectedVehicleImageFrontName}
                                </p>
                              </div>
                              <Button
                                ref={field.ref}
                                onClick={() => {
                                  document
                                    .getElementById(
                                      "employee-vehicle-image-front",
                                    )
                                    ?.click();
                                }}
                                type="button"
                                className="h-9 w-full rounded-[10px] bg-[#336AEA] px-6 text-white hover:bg-[#2958CA] sm:w-auto"
                              >
                                Upload
                              </Button>

                              <input
                                id="employee-vehicle-image-front"
                                type="file"
                                accept="image/png,image/jpeg"
                                className="hidden"
                                onChange={(event) => {
                                  const file = event.target.files?.[0];
                                  setSelectedVehicleImageFrontName(
                                    file?.name ?? "No file chosen",
                                  );
                                  field.onChange(file ?? undefined);
                                }}
                              />
                            </div>
                          </div>
                        </FormControl>
                        <p className="text-xs text-[#667185]">
                          Max size: 5MB. Supported formats: JPG, PNG
                        </p>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="vehicleImageBack"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className={employeeLabelClassName}>
                          Vehicle Image (Back)
                        </FormLabel>
                        <FormControl>
                          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
                            <div className="h-12.5 w-12.5 shrink-0 rounded-full bg-[#F2F4F7] flex items-center justify-center self-start sm:self-auto">
                              <Upload className="h-4.5 w-4.5 text-[#667085]" />
                            </div>

                            <div className="flex w-full min-w-0 flex-col gap-3 rounded-[6px] border border-[#D0D5DD] bg-white px-4 py-4 box-border sm:h-12.75 sm:flex-row sm:items-center sm:justify-between sm:py-5.5">
                              <div className="flex min-w-0 items-center gap-3">
                                <label
                                  htmlFor="employee-vehicle-image-back"
                                  className="inline-flex cursor-pointer items-center rounded-xl border-none py-2 text-sm font-medium text-[#344054] hover:bg-[#F2F4F7] sm:pl-3"
                                >
                                  Choose file
                                </label>
                                <p className="truncate text-sm text-[#98A2B3]">
                                  {selectedVehicleImageBackName}
                                </p>
                              </div>
                              <Button
                                ref={field.ref}
                                onClick={() => {
                                  document
                                    .getElementById(
                                      "employee-vehicle-image-back",
                                    )
                                    ?.click();
                                }}
                                type="button"
                                className="h-9 w-full rounded-[10px] bg-[#336AEA] px-6 text-white hover:bg-[#2958CA] sm:w-auto"
                              >
                                Upload
                              </Button>

                              <input
                                id="employee-vehicle-image-back"
                                type="file"
                                accept="image/png,image/jpeg"
                                className="hidden"
                                onChange={(event) => {
                                  const file = event.target.files?.[0];
                                  setSelectedVehicleImageBackName(
                                    file?.name ?? "No file chosen",
                                  );
                                  field.onChange(file ?? undefined);
                                }}
                              />
                            </div>
                          </div>
                        </FormControl>
                        <p className="text-xs text-[#667185]">
                          Max size: 5MB. Supported formats: JPG, PNG
                        </p>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                 </div>

                 <h2 className="text-2xl text-[#1A1A21] font-semibold text-center">
                  Other Details
                 </h2>

          
                    <FormField
                      control={form.control}
                      name="dateOfJoining"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className={employeeLabelClassName}>
                            Date of Joining
                          </FormLabel>
                          <FormControl>
                            <Popover>
                              <PopoverTrigger asChild>
                                <Button
                                  type="button"
                                  variant="outline"
                                  className="h-14 w-full max-w-127.5 justify-between rounded-[6px] border border-[#D0D5DD] px-4 py-4 font-normal text-base"
                                >
                                  <span
                                    className={
                                      field.value
                                        ? "text-[#101828]"
                                        : "text-[#98A2B3]"
                                    }
                                  >
                                    {field.value
                                      ? new Date(field.value).toLocaleDateString(
                                          "en-US",
                                          {
                                            year: "numeric",
                                            month: "long",
                                            day: "numeric",
                                          }
                                        )
                                      : "Pick a date"}
                                  </span>
                                  <CalendarIcon className="h-4 w-4 text-[#667085]" />
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent className="w-auto p-0" align="start">
                                <Calendar
                                  mode="single"
                                  selected={
                                    field.value
                                      ? new Date(field.value)
                                      : undefined
                                  }
                                  onSelect={(date) => {
                                    field.onChange(
                                      date
                                        ? date.toISOString().split("T")[0]
                                        : ""
                                    );
                                  }}
                                  disabled={(date) =>
                                    date > new Date() ||
                                    date <
                                      new Date(
                                        new Date().setFullYear(
                                          new Date().getFullYear() - 60
                                        )
                                      )
                                  }
                                  initialFocus
                                />
                              </PopoverContent>
                            </Popover>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                  
              

                  <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                    <FormField
                      control={form.control}
                      name={"salary" as any}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className={employeeLabelClassName}>
                            Salary Amount
                          </FormLabel>
                          <FormControl>
                            <div className="relative h-14 w-full max-w-61.5">
                              <Input
                                {...field}
                                type="number"
                                inputMode="numeric"
                                placeholder="0"
                                className="h-14 w-full rounded-[6px] border border-[#D0D5DD] px-4 py-4 pr-16 text-base text-[#101828] placeholder:text-[#98A2B3]"
                              />
                              <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-xs text-[#98A2B3]">
                                /Day
                              </span>
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name={"incentive" as any}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className={employeeLabelClassName}>
                            Incentive
                          </FormLabel>
                          <FormControl>
                            <div className="relative h-14 w-full max-w-61.5">
                              <Input
                                {...field}
                                type="number"
                                inputMode="numeric"
                                placeholder="0"
                                className="h-14 w-full rounded-[6px] border border-[#D0D5DD] px-4 py-4 pr-16 text-base text-[#101828] placeholder:text-[#98A2B3]"
                              />
                              <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-xs text-[#98A2B3]">
                                /Day
                              </span>
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="payoutDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className={employeeLabelClassName}>
                          Payout Date
                        </FormLabel>
                        <FormControl>
                          <div className="flex h-14 w-full max-w-127.5 items-center gap-3 rounded-[6px] border border-[#D0D5DD] bg-white px-2 py-4 box-border">
                            <Select
                              value={field.value}
                              onValueChange={field.onChange}
                            >
                              <SelectTrigger className="border-0 p-0 h-full flex-1 focus:ring-0 shadow-none px-1.5">
                                <SelectValue placeholder="Select day (1-30)" />
                              </SelectTrigger>
                              <SelectContent>
                                {Array.from({ length: 30 }, (_, i) => i + 1).map(
                                  (day) => (
                                    <SelectItem
                                      key={day}
                                      value={day.toString()}
                                    >
                                      {day}
                                    </SelectItem>
                                  )
                                )}
                              </SelectContent>
                            </Select>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="border-t border-[#EAECF0] pt-6">
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setStep(step - 1)}
                        style={{
                          width: 220,
                          height: 48,
                          gap: 10,
                          borderRadius: 8,
                          borderWidth: 1.5,
                          paddingTop: 16,
                          paddingRight: 24,
                          paddingBottom: 16,
                          paddingLeft: 24,
                        }}
                        className="border-[#101828] bg-white text-lg font-semibold text-[#101828] hover:bg-[#F9FAFB]"
                      >
                        Previous
                      </Button>
                      <Button
                        type="button"
                        onClick={() => {}}
                        style={{
                          width: 220,
                          height: 48,
                          gap: 10,
                          borderRadius: 8,
                          borderWidth: 1.5,
                          paddingTop: 16,
                          paddingRight: 24,
                          paddingBottom: 16,
                          paddingLeft: 24,
                        }}
                        className="bg-[#336AEA] text-lg font-semibold text-white hover:bg-[#2958CA]"
                      >
                        Submit
                      </Button>
                    </div>
                  </div>
                </form>
              </Form>
            </div>
          )}
        </div>
        <div className="w-full min-w-0 rounded-[10px] border border-[#E4E7EC] bg-[#FFFFFF] p-6 gap-2 xl:w-99.5">
          <div className="flex flex-col gap-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-[#000000] items-center justify-center flex text-[#F0F0F0] font-bold text-[20px]">
                1
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-[#101928] font-semibold text-base">
                  Personal Details
                </span>
                <span className="text-[#475367] font-normal text-xs">
                  Fill out these Personal details
                </span>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div
                className={`w-12 h-12 rounded-full  items-center justify-center flex text-[#98A2B3] font-bold text-[20px] transition-colors duration-300 ease-out ${step > 1 ? "bg-[#000000] border-none text-[#F0F0F0]" : "bg-[#FFFFFF]   border border-[#98A2B3]"}`}
              >
                2
              </div>
              <div className="flex flex-col gap-1">
                <span
                  className={` font-semibold text-base transition-colors duration-300 ease-out ${step > 1 ? "text-[#101928]" : "text-[#475367]"}`}
                >
                  Role & Password
                </span>
                <span
                  className={` font-normal text-xs transition-colors duration-300 ease-out    ${step > 1 ? "text-[#475367]" : "text-[#98A2B3]"}`}
                >
                  Fill out these Role & Password details
                </span>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div
                className={`w-12 h-12 rounded-full  items-center justify-center flex text-[#98A2B3] font-bold text-[20px] transition-colors duration-300 ease-out ${step > 2 ? "bg-[#000000] border-none text-[#F0F0F0]" : "bg-[#FFFFFF]   border border-[#98A2B3]"}`}
              >
                3
              </div>
              <div className="flex flex-col gap-1">
                <span
                  className={` font-semibold text-base transition-colors duration-300 ease-out ${step > 2 ? "text-[#101928]" : "text-[#475367]"}`}
                >
                  KYC Verification
                </span>
                <span
                  className={` font-normal text-xs transition-colors duration-300 ease-out ${step > 2 ? "text-[#475367]" : "text-[#98A2B3]"}`}
                >
                  Fill out these KYC Verification details
                </span>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div
                className={`w-12 h-12 rounded-full  items-center justify-center flex text-[#98A2B3] font-bold text-[20px] transition-colors duration-300 ease-out ${step > 3 ? "bg-[#000000] border-none text-[#F0F0F0]" : "bg-[#FFFFFF]   border border-[#98A2B3]"}`}
              >
                4
              </div>
              <div className="flex flex-col gap-1">
                <span
                  className={` font-semibold text-base transition-colors duration-300 ease-out ${step > 3 ? "text-[#101928]" : "text-[#475367]"}`}
                >
                  Bank & Documents
                </span>
                <span
                  className={` font-normal text-xs transition-colors duration-300 ease-out ${step > 3 ? "text-[#475367]" : "text-[#98A2B3]"}`}
                >
                  Setup Bank & Documents details
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddEmployee;

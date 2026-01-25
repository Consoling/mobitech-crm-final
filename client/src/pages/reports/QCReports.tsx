import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Clipboard, Download, Search } from "lucide-react";
import React from "react";

const QCReports = () => {
  return (
    <div className="px-6 py-6">
      {/* Header with icon and title */}
      <div className="flex items-center justify-between gap-4 mb-6">
        {/* Wallet Icon with gradient background */}
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-linear-to-br from-[#009966] to-[#007A55] flex items-center justify-center">
            <Clipboard className="w-6 h-6 text-white" />
          </div>

          {/* Title and subtitle */}
          <div className="flex flex-col">
            <h1 className="text-2xl font-bold">QC Reports</h1>
            <p className="text-[#62748E] text-base font-normal">
              Quality control inspection reports
            </p>
          </div>
        </div>
        {/* Export Layer */}
        <div>
          <Button className="ml-auto flex items-center gap-2 bg-[#FFFFFF] border border-[#E2E8F0] text-[#314158] hover:bg-gray-100 hover:border-gray-300 shadow-sm shadow-gray-600/40 radius-[34px] min-[550px]:h-11.5 min-[550px]:w-30">
            <Download />
            <span className="md:block hidden"> Export</span>
          </Button>
        </div>

      </div>

        {/* Search Layer */}

          <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <Input
          // ref={inputRef}
          // className={inputClassName ?? "h-10.5 pl-10 text-sm"}
          // placeholder={placeholder}
          // value={value}
          // onChange={(e) => {
          //   onValueChange(e.target.value);
          //   if (enableAutocomplete && e.target.value.length >= 2) {
          //     setShowDropdown(true);
          //   }
          // }}
          // onKeyDown={handleKeyDown}
          // onFocus={() => {
          //   if (enableAutocomplete && value.length >= 2 && autocompleteResults.length > 0) {
          //     setShowDropdown(true);
          //   }
          // }}
        />
        
        {/* Autocomplete Dropdown */}
        {/* {enableAutocomplete && (
          <AutocompleteDropdown
            results={autocompleteResults}
            isOpen={showDropdown}
            onSelect={handleSelect}
            activeIndex={activeIndex}
            onActiveIndexChange={setActiveIndex}
            loading={loading}
          />
        )} */}
      </div>
    </div>
  );
};

export default QCReports;

import { Plus, Search } from "lucide-react";
import React, { useRef} from "react";
import { Input } from "../ui/input";
import { Button } from "../ui/button";

interface EmployeeSearchBarProps {
  value: string;
  onValueChange: (value: string) => void;
  placeholder?: string;

  wrapperClassName?: string;
  inputClassName?: string;
  filterButtonClassName?: string;

  showFilter?: boolean;
  filterLabel?: string;
  filterTitle?: string;
  filterDescription?: string;
  filterContent?: React.ReactNode;

  enableAutocomplete?: boolean;
  onAutocompleteSelect?: (result: any) => void;
}

const EmployeeSearchBar = ({
  placeholder = "Search employees...",
  wrapperClassName = "flex items-center justify-between",
  enableAutocomplete = false,
  showFilter = true,
  ...props
}: EmployeeSearchBarProps) => {
  // const [showDropdown, setShowDropdown] = useState(false);
  const empWrapperRef = useRef<HTMLDivElement>(null);
  const employeeInputRef = useRef<HTMLInputElement>(null);
  return (
    <div className={wrapperClassName} ref={empWrapperRef}>
      <div className="relative flex-1 max-sm:w-full">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <Input
          ref={employeeInputRef}
          type="text"
          placeholder={placeholder}
          className={props.inputClassName ?? "h-10.5 pl-10 text-sm"}
          value={props.value}
          onChange={(e) => {
            props.onValueChange(e.target.value);
            
          }}
        />
      </div>
      <div className=" max-[550px]:w-full max-[550px]:mt-3">
        <Button className="max-[550px]:w-full h-12 ml-auto flex items-center justify-center gap-2 whitespace-nowrap px-4 bg-[#7F22FE]  text-[#FFFFFF] hover:bg-[#7008E7]  shadow-sm shadow-gray-600/40 rounded-[34px] min-[550px]:h-11.5 min-[550px]:min-w-42.5">
          <Plus />
          <span className="md:block "> Add New Employee</span>
        </Button>
      </div>
    </div>
  );
};

export default EmployeeSearchBar;

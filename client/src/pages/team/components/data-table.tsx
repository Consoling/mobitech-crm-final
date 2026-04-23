"use client";

import * as React from "react";
import {
  IconChevronDown,
  IconChevronLeft,
  IconChevronRight,
  IconChevronsLeft,
  IconChevronsRight,
  IconDotsVertical,
  IconFilter,
} from "@tabler/icons-react";
import {
  flexRender,
  getCoreRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type ColumnFiltersState,
  type SortingState,
  type VisibilityState,
} from "@tanstack/react-table";
import { useNavigate, type NavigateFunction } from "react-router-dom";
import { z } from "zod";


import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import ConfirmDialog from "@/components/common/ConfirmDialog";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  BriefcaseBusiness,
  Eye,
  Handshake,
  MapPinned,
  Repeat2,
  Shield,
  Store,
  UserCircle,
  Wrench,
  type LucideIcon,
} from "lucide-react";

export const schema = z.object({
  id: z.union([z.number(), z.string()]),
  view: z.string(),
  name: z.string(),
  email: z.string(),
  employeeId: z.string(),
  phone: z.string(),
  createdAt: z.string(),
  role: z.string(),
  status: z.string(),
});

export const storeSchema = z.object({
  id: z.union([z.number(), z.string()]),
  view: z.string(),
  ownerName: z.string(),
  storeId: z.string(),
  storeName: z.string(),
  ownerPhone: z.string(),
  address: z.string(),
  createdAt: z.string(),
  status: z.string(),
});

const ROLE_ICON_MAP: Record<string, LucideIcon> = {
  Admin: Shield,
  "Store Manager": Store,
  "Sales Agent": Handshake,
  technician: Wrench,
  "Technician": Wrench,
  "Field Executive": MapPinned,
  "Exchange Partner": Repeat2,
};

const getRoleIcon = (role: string): LucideIcon => {
  return ROLE_ICON_MAP[role] ?? BriefcaseBusiness;
};

const getFilterColumnLabel = (columnId: string): string => {
  if (columnId === "employeeId") {
    return "Employee ID";
  }

  if (columnId === "createdAt") {
    return "Registration Date";
  }

  return columnId;
};

const isDateWithinRange = (dateValue: string, range: string): boolean => {
  const currentDate = new Date();
  const targetDate = new Date(dateValue);

  if (Number.isNaN(targetDate.getTime())) {
    return false;
  }

  if (range === "thisWeek") {
    const startOfWeek = new Date(currentDate);
    const dayOfWeek = (currentDate.getDay() + 6) % 7;
    startOfWeek.setDate(currentDate.getDate() - dayOfWeek);
    startOfWeek.setHours(0, 0, 0, 0);

    return targetDate >= startOfWeek && targetDate <= currentDate;
  }

  if (range === "thisMonth") {
    const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);

    return targetDate >= startOfMonth && targetDate <= currentDate;
  }

  if (range === "thisYear") {
    const startOfYear = new Date(currentDate.getFullYear(), 0, 1);

    return targetDate >= startOfYear && targetDate <= currentDate;
  }

  return true;
};

type ActionMenuCellProps = {
  entityType: "employee" | "store";
  entityLabel: string;
  onEdit?: () => void;
};

const ActionMenuCell = ({ entityType, entityLabel, onEdit }: ActionMenuCellProps) => {
  const [isDisableDialogOpen, setIsDisableDialogOpen] = React.useState(false);
  const [isTerminateDialogOpen, setIsTerminateDialogOpen] = React.useState(false);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            className="flex size-8 text-muted-foreground data-[state=open]:bg-muted"
            size="icon"
          >
            <IconDotsVertical />
            <span className="sr-only">Open menu</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-32">
          <DropdownMenuItem
            onSelect={(event) => {
              if (!onEdit) {
                return;
              }

              event.preventDefault();
              onEdit();
            }}
          >
            Edit
          </DropdownMenuItem>
          <DropdownMenuItem
            onSelect={(event) => {
              event.preventDefault();
              setIsDisableDialogOpen(true);
            }}
          >
            Disable
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            variant="destructive"
            onSelect={(event) => {
              event.preventDefault();
              setIsTerminateDialogOpen(true);
            }}
          >
            Terminate
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <ConfirmDialog
        open={isDisableDialogOpen}
        onOpenChange={setIsDisableDialogOpen}
        onConfirm={() => {
          setIsDisableDialogOpen(false);
        }}
        title={`Disable ${entityType}`}
        description={`Are you sure you want to disable ${entityLabel}? You can re-enable it later.`}
        confirmText="Disable"
        cancelText="Cancel"
      />

      <ConfirmDialog
        open={isTerminateDialogOpen}
        onOpenChange={setIsTerminateDialogOpen}
        onConfirm={() => {
          setIsTerminateDialogOpen(false);
        }}
        title={`Terminate ${entityType}`}
        description={`Are you sure you want to terminate ${entityLabel}? This action should be used carefully.`}
        confirmText="Terminate"
        cancelText="Cancel"
      />
    </>
  );
};

const createEmployeeColumns = (
  navigate: NavigateFunction,
): ColumnDef<z.infer<typeof schema>>[] => [
  {
    accessorKey: "view",
    header: "View",
    cell: ({ row }) => (
      <Button
        variant="ghost"
        size="sm"
        className="h-8 px-2 text-[#296CFF]"
        onClick={() => navigate(`/manage-team/view-employee/${encodeURIComponent(String(row.original.employeeId))}`)}
      >
        <Eye className="mr-1 h-4 w-4" />
      </Button>
    ),
  },
  {
    accessorKey: "name",
    header: "Name",
    cell: ({ row }) => (
      <div className="flex items-center gap-3 h-14.5">
        <Avatar size="default">
          <AvatarFallback className="bg-[#E5E7EB] text-[#344054] font-medium">
            {row.original.name.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-[#101928]">
            {row.original.name}
          </p>
          <p className="truncate text-xs text-[#475367]">
            {row.original.email}
          </p>
        </div>
      </div>
    ),
    enableHiding: false,
  },
  {
    accessorKey: "employeeId",
    header: "Employee ID",
    cell: ({ row }) => (
      <span className="text-[#344054] font-normal text-xs">
        {row.original.employeeId}
      </span>
    ),
  },
  {
    accessorKey: "phone",
    header: "Phone",
    cell: ({ row }) => (
      <Badge
        variant="outline"
        className="border-none bg-[#F2F4F7] px-3 py-1 text-xs font-medium text-[#000000]"
      >
        {row.original.phone}
      </Badge>
    ),
  },
  {
    accessorKey: "createdAt",
    header: "Date",
    filterFn: (row, columnId, filterValue: string) => {
      if (!filterValue) {
        return true;
      }

      return isDateWithinRange(row.getValue(columnId), filterValue);
    },
    cell: ({ row }) => (
      <div className="flex items-center gap-2 whitespace-nowrap text-xs font-normal text-[#344054]">
        <span>
          {new Intl.DateTimeFormat("en-US", {
            month: "short",
            day: "2-digit",
            year: "numeric",
          }).format(new Date(row.original.createdAt))}
        </span>
        <span className="text-[#b8bfca]">|</span>
        <span>
          {new Intl.DateTimeFormat("en-US", {
            hour: "2-digit",
            minute: "2-digit",
            hour12: true,
          })
            .format(new Date(row.original.createdAt))
            .replace(" ", "")}
        </span>
      </div>
    ),
  },
  {
    accessorKey: "role",
    header: "Role",
    filterFn: (row, columnId, filterValue: string[]) => {
      if (!Array.isArray(filterValue) || filterValue.length === 0) {
        return true;
      }

      return filterValue.includes(row.getValue(columnId));
    },
    cell: ({ row }) => (
      (() => {
        const RoleIcon = getRoleIcon(row.original.role);

        return (
          <Badge
            variant="outline"
            className="inline-flex items-center gap-1 border-none font-semibold bg-[#E8EFFF] px-3 py-1 text-[#155DFC] text-xs"
          >
            <Avatar size="sm" className="size-5">
              <AvatarFallback className="bg-[#DCE7FF] shadow-lg text-[#155DFC] font-medium">
                <RoleIcon className="size-3.5" />
              </AvatarFallback>
            </Avatar>
            <span>{row.original.role}</span>
          </Badge>
        );
      })()
    ),
  },
  {
    accessorKey: "status",
    header: "Status",
    filterFn: (row, columnId, filterValue: string[]) => {
      if (!Array.isArray(filterValue) || filterValue.length === 0) {
        return true;
      }

      return filterValue.includes(row.getValue(columnId));
    },
    cell: ({ row }) => (
      <Badge
        variant="outline"
        className={` ${
          row.original.status === "Active"
            ? "border-none bg-[#CEFFE2] text-[#00A63E] px-3"
            : "border-none bg-[#FFE2E2] text-[#E70000] px-3"
        }`}
      >
        {row.original.status}
      </Badge>
    ),
  },
  {
    id: "actions",
    header: "Action",
    cell: ({ row }) => (
      <ActionMenuCell
        entityType="employee"
        entityLabel={row.original.name}
        onEdit={() =>
          navigate(
            `/manage-team/edit-employee/${encodeURIComponent(String(row.original.employeeId))}`,
          )
        }
      />
    ),
  },
];

const createStoreColumns = (
  navigate: NavigateFunction,
): ColumnDef<z.infer<typeof storeSchema>>[] => [
  {
    accessorKey: "view",
    header: "View",
    cell: ({ row }) => (
      <Button
        variant="ghost"
        size="sm"
        className="h-8 px-2 text-[#296CFF]"
        onClick={() =>
          navigate(
            `/manage-team/view-store/${encodeURIComponent(String(row.original.storeId))}`,
          )
        }
      >
        <Eye className="mr-1 h-4 w-4" />
      </Button>
    ),
  },
  {
    accessorKey: "ownerName",
    header: "Owner Name",
    cell: ({ row }) => (
      <div className="flex items-center gap-3 h-14.5">
        <Avatar size="default">
          <AvatarFallback className="bg-[#E5E7EB] text-[#344054] font-medium">
            {row.original.ownerName.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-[#101928]">
            {row.original.ownerName}
          </p>
          <p className="truncate text-xs text-[#475367]">
            {row.original.storeName}
          </p>
        </div>
      </div>
    ),
  },
  {
    accessorKey: "storeId",
    header: "Store ID",
    cell: ({ row }) => (
      <span className="text-[#344054] font-normal text-xs">
        {row.original.storeId}
      </span>
    ),
  },
  {
    accessorKey: "storeName",
    header: "Store Name",
    cell: ({ row }) => (
      <span className="text-[#344054] font-normal text-xs">
        {row.original.storeName}
      </span>
    ),
  },
  {
    accessorKey: "ownerPhone",
    header: "Owner Phone",
    cell: ({ row }) => (
      <Badge
        variant="outline"
        className="border-none bg-[#F2F4F7] px-3 py-1 text-xs font-medium text-[#000000]"
      >
        {row.original.ownerPhone}
      </Badge>
    ),
  },
  {
    accessorKey: "address",
    header: "Address",
    cell: ({ row }) => (
      <span className="text-[#344054] font-normal text-xs">
        {row.original.address}
      </span>
    ),
  },
  {
    accessorKey: "createdAt",
    header: "Date",
    filterFn: (row, columnId, filterValue: string) => {
      if (!filterValue) {
        return true;
      }

      return isDateWithinRange(row.getValue(columnId), filterValue);
    },
    cell: ({ row }) => (
      <div className="flex items-center gap-2 whitespace-nowrap text-xs font-normal text-[#344054]">
        <span>
          {new Intl.DateTimeFormat("en-US", {
            month: "short",
            day: "2-digit",
            year: "numeric",
          }).format(new Date(row.original.createdAt))}
        </span>
        <span className="text-[#b8bfca]">|</span>
        <span>
          {new Intl.DateTimeFormat("en-US", {
            hour: "2-digit",
            minute: "2-digit",
            hour12: true,
          })
            .format(new Date(row.original.createdAt))
            .replace(" ", "")}
        </span>
      </div>
    ),
  },
  {
    accessorKey: "status",
    header: "Status",
    filterFn: (row, columnId, filterValue: string[]) => {
      if (!Array.isArray(filterValue) || filterValue.length === 0) {
        return true;
      }

      return filterValue.includes(row.getValue(columnId));
    },
    cell: ({ row }) => (
      <Badge
        variant="outline"
        className={` ${
          row.original.status === "Active"
            ? "border-none bg-[#CEFFE2] text-[#00A63E] px-3"
            : "border-none bg-[#FFE2E2] text-[#E70000] px-3"
        }`}
      >
        {row.original.status}
      </Badge>
    ),
  },
  {
    id: "actions",
    header: "Action",
    cell: ({ row }) => (
      <ActionMenuCell
        entityType="store"
        entityLabel={row.original.storeName}
        onEdit={() =>
          navigate(
            `/manage-team/edit-store/${encodeURIComponent(String(row.original.storeId))}`,
          )
        }
      />
    ),
  },
];

export function EmployeeDataTable({
  data: initialData,
  onTabChange,
}: {
  data: { employees: z.infer<typeof schema>[]; stores: z.infer<typeof storeSchema>[] };
  onTabChange?: (tab: "employees" | "stores") => void;
}) {
  const navigate = useNavigate();
  const employeeColumns = React.useMemo(
    () => createEmployeeColumns(navigate),
    [navigate],
  );
  const storeColumns = React.useMemo(
    () => createStoreColumns(navigate),
    [navigate],
  );
  const employeeData = initialData.employees;
  const storeData = initialData.stores;
  const [rowSelection, setRowSelection] = React.useState({});
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({});
  const [employeeColumnFilters, setEmployeeColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [storeColumnFilters, setStoreColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [pagination, setPagination] = React.useState({
    pageIndex: 0,
    pageSize: 10,
  });
  const [expandedSections, setExpandedSections] = React.useState<{
    role: boolean;
    status: boolean;
    date: boolean;
  }>({
    role: true,
    status: true,
    date: true,
  });
  const [currentTab, setCurrentTab] = React.useState("employees");

  const roleOptions = React.useMemo(
    () => Array.from(new Set(employeeData.map((employee) => employee.role))).sort(),
    [employeeData],
  );
  const roleCounts = React.useMemo(() => {
    return employeeData.reduce<Record<string, number>>((accumulator, employee) => {
      accumulator[employee.role] = (accumulator[employee.role] ?? 0) + 1;
      return accumulator;
    }, {});
  }, [employeeData]);
  const statusOptions = React.useMemo(
    () => Array.from(new Set(employeeData.map((employee) => employee.status))).sort(),
    [employeeData],
  );
  const createdAtOptions = React.useMemo(
    () => [
      { value: "thisWeek", label: "This Week" },
      { value: "thisMonth", label: "This Month" },
      { value: "thisYear", label: "This Year" },
    ],
    [],
  );

  const employeeTable = useReactTable({
    data: employeeData,
    columns: employeeColumns,
    state: {
      sorting,
      columnVisibility,
      rowSelection,
      columnFilters: employeeColumnFilters,
      pagination,
    },
    getRowId: (row) => row.id.toString(),
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    onColumnFiltersChange: setEmployeeColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
  });

  const storeTable = useReactTable({
    data: storeData,
    columns: storeColumns,
    state: {
      sorting,
      columnVisibility,
      rowSelection,
      columnFilters: storeColumnFilters,
      pagination,
    },
    getRowId: (row) => row.id.toString(),
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    onColumnFiltersChange: setStoreColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
  });

  const selectedRoles =
    (employeeTable.getColumn("role")?.getFilterValue() as string[] | undefined) ?? [];
  const selectedStatuses =
    (employeeTable.getColumn("status")?.getFilterValue() as string[] | undefined) ?? [];
  const selectedCreatedAtRange =
    (employeeTable.getColumn("createdAt")?.getFilterValue() as string | undefined) ?? undefined;

  const toggleRoleFilter = React.useCallback(
    (role: string, checked: boolean) => {
      const roleColumn = employeeTable.getColumn("role");

      if (!roleColumn) {
        return;
      }

      const currentRoles = (roleColumn.getFilterValue() as string[] | undefined) ?? [];
      const nextRoles = checked
        ? Array.from(new Set([...currentRoles, role]))
        : currentRoles.filter((currentRole) => currentRole !== role);

      roleColumn.setFilterValue(nextRoles.length > 0 ? nextRoles : undefined);
    },
    [employeeTable],
  );

  const toggleStatusFilter = React.useCallback(
    (status: string, checked: boolean) => {
      const statusColumn = employeeTable.getColumn("status");

      if (!statusColumn) {
        return;
      }

      const currentStatuses = (statusColumn.getFilterValue() as string[] | undefined) ?? [];
      const nextStatuses = checked
        ? Array.from(new Set([...currentStatuses, status]))
        : currentStatuses.filter((currentStatus) => currentStatus !== status);

      statusColumn.setFilterValue(nextStatuses.length > 0 ? nextStatuses : undefined);
    },
    [employeeTable],
  );

  const toggleCreatedAtFilter = React.useCallback(
    (range: string, checked: boolean) => {
      const createdAtColumn = employeeTable.getColumn("createdAt");

      if (!createdAtColumn) {
        return;
      }

      createdAtColumn.setFilterValue(checked ? range : undefined);
    },
    [employeeTable],
  );

  const handleTabChange = React.useCallback(
    (nextTab: string) => {
      if (nextTab !== "employees" && nextTab !== "stores") {
        return;
      }

      setCurrentTab(nextTab);
      onTabChange?.(nextTab);
    },
    [onTabChange],
  );

  return (
    <Tabs
      value={currentTab}
      onValueChange={handleTabChange}
      className="w-full flex-col justify-start gap-6"
    >
      <div className="flex md:flex-row flex-col max-md:gap-y-3 max-md:items-start items-center justify-between px-4 lg:px-6 bg-[#FFFFFF] border py-2 ">
        <TabsList className=" **:data-[slot=badge]:size-5 **:data-[slot=badge]:rounded-full **:data-[slot=badge]:bg-muted-foreground/30  **:data-[slot=badge]:px-1 @4xl/main:flex gap-3">
          <TabsTrigger
            value="employees"
            className="data-[state=active]:text-[#296CFF]  hover:text-[#296CFF]"
          >
            <UserCircle /> Employees <Badge variant="secondary">{employeeTable.getFilteredRowModel().rows.length}</Badge>
          </TabsTrigger>
          <TabsTrigger
            value="stores"
            className="data-[state=active]:text-[#296CFF]  hover:text-[#296CFF]"
          >
            <Store /> Stores <Badge variant="secondary">{storeTable.getFilteredRowModel().rows.length}</Badge>
          </TabsTrigger>
        </TabsList>
        <div className="flex items-center gap-2">
          {/* Employee Filters - Only show on employees tab */}
          {currentTab === "employees" && (
            <>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="group rounded-xl">
                    <span>All Categories</span>
                    <IconChevronDown
                      className={`group-data-[state=open]:-rotate-180 transition-transform ease-in-out delay-100 text-gray-900`}
                    />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  {employeeTable
                    .getAllColumns()
                    .filter(
                      (column) =>
                        typeof column.accessorFn !== "undefined" &&
                        column.getCanHide() &&
                        column.id !== "view",
                    )
                    .map((column) => {
                      return (
                        <DropdownMenuCheckboxItem
                          key={column.id}
                          className="capitalize"
                          checked={column.getIsVisible()}
                          onCheckedChange={(value) =>
                            column.toggleVisibility(!!value)
                          }
                        >
                          {getFilterColumnLabel(column.id)}
                        </DropdownMenuCheckboxItem>
                      );
                    })}
                </DropdownMenuContent>
              </DropdownMenu>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="group rounded-xl">
                    <span>Role</span>
                    <IconChevronDown
                      className={`group-data-[state=open]:-rotate-180 transition-transform ease-in-out delay-100 text-gray-900`}
                    />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuCheckboxItem
                    checked={selectedRoles.length === 0}
                    onCheckedChange={() => employeeTable.getColumn("role")?.setFilterValue(undefined)}
                  >
                    All Roles
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuSeparator />
                  {roleOptions.map((role) => (
                    <DropdownMenuCheckboxItem
                      key={role}
                      checked={selectedRoles.includes(role)}
                      onCheckedChange={(checked) => toggleRoleFilter(role, checked === true)}
                    >
                      {(() => {
                        const RoleIcon = getRoleIcon(role);
                        return <RoleIcon className="mr-2 size-4 text-[#155DFC]" />;
                      })()}
                      <span>{role}</span>
                      <span className="ml-auto text-xs text-[#667085]">
                        {roleCounts[role] ?? 0}
                      </span>
                    </DropdownMenuCheckboxItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="outline" size="sm" className="group rounded-xl">
                    <IconFilter />
                    <span>Filter</span>
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-96 overflow-y-auto px-4">
                  <SheetHeader className="mb-6">
                    <SheetTitle>Filters</SheetTitle>
                    <SheetDescription>
                      Customize your view by selecting filters
                    </SheetDescription>
                  </SheetHeader>

                  {/* Role Filter Section */}
                  <div className="space-y-4 border-b pb-4 mb-4">
                    <button
                      onClick={() =>
                        setExpandedSections((prev) => ({
                          ...prev,
                          role: !prev.role,
                        }))
                      }
                      className="flex w-full items-center justify-between font-semibold text-[#101928] hover:text-[#296CFF]"
                    >
                      <span>Role</span>
                      <IconChevronDown
                        className={`transition-transform ${
                          expandedSections.role ? "" : "-rotate-90"
                        }`}
                        size={20}
                      />
                    </button>
                    {expandedSections.role && (
                      <div className="space-y-3 pl-2">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <Checkbox
                            checked={selectedRoles.length === 0}
                            onCheckedChange={() =>
                              employeeTable.getColumn("role")?.setFilterValue(undefined)
                            }
                          />
                          <span className="text-sm text-[#344054]">All Roles</span>
                        </label>
                        {roleOptions.map((role) => (
                          <label
                            key={role}
                            className="flex w-full items-center gap-2 cursor-pointer"
                          >
                            <Checkbox
                              checked={selectedRoles.includes(role)}
                              onCheckedChange={(checked) =>
                                toggleRoleFilter(role, checked === true)
                              }
                            />
                            <div className="flex items-center gap-2">
                              {(() => {
                                const RoleIcon = getRoleIcon(role);
                                return (
                                  <RoleIcon className="size-4 text-[#155DFC]" />
                                );
                              })()}
                              <span className="text-sm text-[#344054]">{role}</span>
                              <span className="ml-auto text-xs text-[#667085]">
                                {roleCounts[role] ?? 0}
                              </span>
                            </div>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Status Filter Section */}
                  <div className="space-y-4 border-b pb-4 mb-4">
                    <button
                      onClick={() =>
                        setExpandedSections((prev) => ({
                          ...prev,
                          status: !prev.status,
                        }))
                      }
                      className="flex w-full items-center justify-between font-semibold text-[#101928] hover:text-[#296CFF]"
                    >
                      <span>Status</span>
                      <IconChevronDown
                        className={`transition-transform ${
                          expandedSections.status ? "" : "-rotate-90"
                        }`}
                        size={20}
                      />
                    </button>
                    {expandedSections.status && (
                      <div className="space-y-3 pl-2">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <Checkbox
                            checked={selectedStatuses.length === 0}
                            onCheckedChange={() =>
                              employeeTable.getColumn("status")?.setFilterValue(undefined)
                            }
                          />
                          <span className="text-sm text-[#344054]">
                            All Statuses
                          </span>
                        </label>
                        {statusOptions.map((status) => (
                          <label
                            key={status}
                            className="flex items-center gap-2 cursor-pointer"
                          >
                            <Checkbox
                              checked={selectedStatuses.includes(status)}
                              onCheckedChange={(checked) =>
                                toggleStatusFilter(status, checked === true)
                              }
                            />
                            <span className="text-sm text-[#344054]">
                              {status}
                            </span>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Registration Date Filter Section */}
                  <div className="space-y-4 pb-4">
                    <button
                      onClick={() =>
                        setExpandedSections((prev) => ({
                          ...prev,
                          date: !prev.date,
                        }))
                      }
                      className="flex w-full items-center justify-between font-semibold text-[#101928] hover:text-[#296CFF]"
                    >
                      <span>Registration Date</span>
                      <IconChevronDown
                        className={`transition-transform ${
                          expandedSections.date ? "" : "-rotate-90"
                        }`}
                        size={20}
                      />
                    </button>
                    {expandedSections.date && (
                      <div className="space-y-3 pl-2">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <Checkbox
                            checked={!selectedCreatedAtRange}
                            onCheckedChange={() =>
                              employeeTable.getColumn("createdAt")?.setFilterValue(undefined)
                            }
                          />
                          <span className="text-sm text-[#344054]">Any Time</span>
                        </label>
                        {createdAtOptions.map((option) => (
                          <label
                            key={option.value}
                            className="flex items-center gap-2 cursor-pointer"
                          >
                            <Checkbox
                              checked={selectedCreatedAtRange === option.value}
                              onCheckedChange={(checked) =>
                                toggleCreatedAtFilter(option.value, checked === true)
                              }
                            />
                            <span className="text-sm text-[#344054]">
                              {option.label}
                            </span>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Clear Filters Button */}
                  <div className="mt-6 flex gap-2">
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={() => {
                        employeeTable.getColumn("role")?.setFilterValue(undefined);
                        employeeTable.getColumn("status")?.setFilterValue(undefined);
                        employeeTable.getColumn("createdAt")?.setFilterValue(undefined);
                      }}
                    >
                      Clear Filters
                    </Button>
                    <SheetClose asChild>
                      <Button className="flex-1 bg-[#296CFF] text-white">
                        Apply
                      </Button>
                    </SheetClose>
                  </div>
                </SheetContent>
              </Sheet>
            </>
          )}

          {/* Store Filters - Only show on stores tab */}
          {currentTab === "stores" && (
            <>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="group rounded-xl">
                    <span>All Categories</span>
                    <IconChevronDown
                      className={`group-data-[state=open]:-rotate-180 transition-transform ease-in-out delay-100 text-gray-900`}
                    />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  {storeTable
                    .getAllColumns()
                    .filter(
                      (column) =>
                        typeof column.accessorFn !== "undefined" &&
                        column.getCanHide() &&
                        column.id !== "view",
                    )
                    .map((column) => {
                      return (
                        <DropdownMenuCheckboxItem
                          key={column.id}
                          className="capitalize"
                          checked={column.getIsVisible()}
                          onCheckedChange={(value) =>
                            column.toggleVisibility(!!value)
                          }
                        >
                          {getFilterColumnLabel(column.id)}
                        </DropdownMenuCheckboxItem>
                      );
                    })}
                </DropdownMenuContent>
              </DropdownMenu>
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="outline" size="sm" className="group rounded-xl">
                    <IconFilter />
                    <span>Filter</span>
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-96 overflow-y-auto px-4">
                  <SheetHeader className="mb-6">
                    <SheetTitle>Filters</SheetTitle>
                    <SheetDescription>
                      Customize your view by selecting filters
                    </SheetDescription>
                  </SheetHeader>

                  {/* Status Filter Section for Stores */}
                  <div className="space-y-4 border-b pb-4 mb-4">
                    <button
                      onClick={() =>
                        setExpandedSections((prev) => ({
                          ...prev,
                          status: !prev.status,
                        }))
                      }
                      className="flex w-full items-center justify-between font-semibold text-[#101928] hover:text-[#296CFF]"
                    >
                      <span>Status</span>
                      <IconChevronDown
                        className={`transition-transform ${
                          expandedSections.status ? "" : "-rotate-90"
                        }`}
                        size={20}
                      />
                    </button>
                    {expandedSections.status && (
                      <div className="space-y-3 pl-2">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <Checkbox
                            checked={
                              !(storeTable.getColumn("status")?.getFilterValue() as string[] | undefined)?.length
                            }
                            onCheckedChange={() =>
                              storeTable.getColumn("status")?.setFilterValue(undefined)
                            }
                          />
                          <span className="text-sm text-[#344054]">
                            All Statuses
                          </span>
                        </label>
                        {statusOptions.map((status) => {
                          const storeSelectedStatuses =
                            (storeTable.getColumn("status")?.getFilterValue() as string[] | undefined) ?? [];
                          return (
                            <label
                              key={status}
                              className="flex items-center gap-2 cursor-pointer"
                            >
                              <Checkbox
                                checked={storeSelectedStatuses.includes(status)}
                                onCheckedChange={(checked) => {
                                  const currentStatuses = storeSelectedStatuses;
                                  const nextStatuses = checked
                                    ? Array.from(new Set([...currentStatuses, status]))
                                    : currentStatuses.filter(
                                        (currentStatus) => currentStatus !== status
                                      );
                                  storeTable
                                    .getColumn("status")
                                    ?.setFilterValue(
                                      nextStatuses.length > 0 ? nextStatuses : undefined
                                    );
                                }}
                              />
                              <span className="text-sm text-[#344054]">
                                {status}
                              </span>
                            </label>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Registration Date Filter Section for Stores */}
                  <div className="space-y-4 pb-4">
                    <button
                      onClick={() =>
                        setExpandedSections((prev) => ({
                          ...prev,
                          date: !prev.date,
                        }))
                      }
                      className="flex w-full items-center justify-between font-semibold text-[#101928] hover:text-[#296CFF]"
                    >
                      <span>Registration Date</span>
                      <IconChevronDown
                        className={`transition-transform ${
                          expandedSections.date ? "" : "-rotate-90"
                        }`}
                        size={20}
                      />
                    </button>
                    {expandedSections.date && (
                      <div className="space-y-3 pl-2">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <Checkbox
                            checked={
                              !(storeTable.getColumn("createdAt")?.getFilterValue() as string | undefined)
                            }
                            onCheckedChange={() =>
                              storeTable.getColumn("createdAt")?.setFilterValue(undefined)
                            }
                          />
                          <span className="text-sm text-[#344054]">Any Time</span>
                        </label>
                        {createdAtOptions.map((option) => (
                          <label
                            key={option.value}
                            className="flex items-center gap-2 cursor-pointer"
                          >
                            <Checkbox
                              checked={
                                (storeTable.getColumn("createdAt")?.getFilterValue() as string | undefined) ===
                                option.value
                              }
                              onCheckedChange={(checked) => {
                                storeTable
                                  .getColumn("createdAt")
                                  ?.setFilterValue(checked ? option.value : undefined);
                              }}
                            />
                            <span className="text-sm text-[#344054]">
                              {option.label}
                            </span>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Clear Filters Button */}
                  <div className="mt-6 flex gap-2">
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={() => {
                        storeTable.getColumn("status")?.setFilterValue(undefined);
                        storeTable.getColumn("createdAt")?.setFilterValue(undefined);
                      }}
                    >
                      Clear Filters
                    </Button>
                    <SheetClose asChild>
                      <Button className="flex-1 bg-[#296CFF] text-white">
                        Apply
                      </Button>
                    </SheetClose>
                  </div>
                </SheetContent>
              </Sheet>
            </>
          )}
        </div>
      </div>

      {/* Tabs Content */}
      <TabsContent
        value="employees"
        className="relative flex flex-col gap-4 overflow-auto px-4 lg:px-6"
      >
        <div className="overflow-hidden  border">
          {/* <DndContext
            collisionDetection={closestCenter}
            modifiers={[restrictToVerticalAxis]}
            onDragEnd={handleDragEnd}
            sensors={sensors}
            id={sortableId}
          >
            
          </DndContext> */}

          <Table>
            <TableHeader className="sticky top-0 z-10 ">
              {employeeTable.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => {
                    return (
                      <TableHead
                        key={header.id}
                        colSpan={header.colSpan}
                        className="font-medium text-[#344054] text-[12px] first:pl-4"
                      >
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                              header.column.columnDef.header,
                              header.getContext(),
                            )}
                      </TableHead>
                    );
                  })}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody className="**:data-[slot=table-cell]:first:w-8 bg-[#FFFFFF]">
              {employeeTable.getRowModel().rows?.length ? (
                employeeTable.getRowModel().rows.map((row) => (
                  <TableRow
                    key={row.id}
                    data-state={row.getIsSelected() && "selected"}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id} className="">
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext(),
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={employeeColumns.length}
                    className="h-24 text-center"
                  >
                    No results.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-center px-4 bg-[#FFFFFF] border py-4">
          
          <div className="flex w-full items-center gap-8 lg:w-fit">
            <div className="hidden items-center gap-2 lg:flex">
              <Label htmlFor="rows-per-page" className="text-sm font-medium">
                Rows per page
              </Label>
              <Select
                value={`${employeeTable.getState().pagination.pageSize}`}
                onValueChange={(value) => {
                  employeeTable.setPageSize(Number(value));
                }}
              >
                <SelectTrigger size="sm" className="w-20" id="rows-per-page">
                  <SelectValue
                    placeholder={employeeTable.getState().pagination.pageSize}
                  />
                </SelectTrigger>
                <SelectContent side="top">
                  {[10, 20, 30, 40, 50].map((pageSize) => (
                    <SelectItem key={pageSize} value={`${pageSize}`}>
                      {pageSize}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex w-fit items-center justify-center text-sm font-medium">
              Page {employeeTable.getState().pagination.pageIndex + 1} of{" "}
              {employeeTable.getPageCount()}
            </div>
            <div className="ml-auto flex items-center gap-2 lg:ml-0">
              <Button
                variant="outline"
                className="hidden h-8 w-8 p-0 lg:flex"
                onClick={() => employeeTable.setPageIndex(0)}
                disabled={!employeeTable.getCanPreviousPage()}
              >
                <span className="sr-only">Go to first page</span>
                <IconChevronsLeft />
              </Button>
              <Button
                variant="outline"
                className="size-8"
                size="icon"
                onClick={() => employeeTable.previousPage()}
                disabled={!employeeTable.getCanPreviousPage()}
              >
                <span className="sr-only">Go to previous page</span>
                <IconChevronLeft />
              </Button>
              <Button
                variant="outline"
                className="size-8"
                size="icon"
                onClick={() => employeeTable.nextPage()}
                disabled={!employeeTable.getCanNextPage()}
              >
                <span className="sr-only">Go to next page</span>
                <IconChevronRight />
              </Button>
              <Button
                variant="outline"
                className="hidden size-8 lg:flex"
                size="icon"
                onClick={() => employeeTable.setPageIndex(employeeTable.getPageCount() - 1)}
                disabled={!employeeTable.getCanNextPage()}
              >
                <span className="sr-only">Go to last page</span>
                <IconChevronsRight />
              </Button>
            </div>
          </div>
        </div>
      </TabsContent>
      <TabsContent
        value="stores"
        className="flex flex-col px-4 lg:px-6 gap-4"
      >
        <div className="overflow-hidden rounded-none border">
          <Table>
            <TableHeader className="sticky top-0 z-10 bg-muted">
              {storeTable.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => {
                    return (
                      <TableHead
                        key={header.id}
                        colSpan={header.colSpan}
                        className="font-medium text-[#344054] text-[12px] first:pl-4"
                      >
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                              header.column.columnDef.header,
                              header.getContext(),
                            )}
                      </TableHead>
                    );
                  })}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody className="**:data-[slot=table-cell]:first:w-8 bg-[#FFFFFF]">
              {storeTable.getRowModel().rows?.length ? (
                storeTable.getRowModel().rows.map((row) => (
                  <TableRow key={row.id} data-state={row.getIsSelected() && "selected"}>
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id} className="">
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext(),
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={storeColumns.length}
                    className="h-24 text-center"
                  >
                    No results.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </TabsContent>
    </Tabs>
  );
}

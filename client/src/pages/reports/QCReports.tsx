import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import SearchFilterBar from "@/components/common/SearchFilterBar";
import {
  Clipboard,
  Download,
  Clock,
  Calendar as CalendarIcon,
  CircleCheckBig,
  CircleX,
  CircleCheck,
  Loader2,
  CalendarDays,
} from "lucide-react";
import React, { useState, useEffect, useRef, useCallback } from "react";
import { useAuthStore } from "@/stores/authStore";
import { apiJson, jsonHeaders } from "@/lib/api";
import { useDebounce } from "@/hooks/useDebounce";
import { format } from "date-fns";
import { useNavigate } from "react-router-dom";


interface QCReport {
  id: string;
  model: string;
  imei1: string;
  imei2: string | null;
  exchangeCode: string;
  performedOn: string;
  employeeId: string;
  employeeName: string;
  dateTime: string;
  metadata: {
    passed: {
      count: number;
      tests: string[];
    };
    failed: {
      count: number;
      tests: string[];
    };
    totalTests: number;
  };
}

interface PaginationInfo {
  currentPage: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

const QCReports = () => {
  const { user } = useAuthStore();
  const route = useNavigate();
  const [searchValue, setSearchValue] = useState("");
  const debouncedSearch = useDebounce(searchValue, 500);
  const [reports, setReports] = useState<QCReport[]>([]);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const observerTarget = useRef<HTMLDivElement>(null);

  // Filter states
  const [timeRange, setTimeRange] = useState<string>("all");
  const [statusFilters, setStatusFilters] = useState<string[]>([]);
  const [customDateRange, setCustomDateRange] = useState<{
    from: Date | undefined;
    to: Date | undefined;
  }>({
    from: undefined,
    to: undefined,
  });

  const [cardsMetaData, setCardsMetadata] = useState({
    tQC: 0,
    mQC: 0,
    PQC: 0,
    FQC: 0,
  });

  const handleStatusChange = (status: string, checked: boolean) => {
    if (checked) {
      setStatusFilters((prev) => [...prev, status]);
    } else {
      setStatusFilters((prev) => prev.filter((s) => s !== status));
    }
  };

  const handleClearFilters = () => {
    setTimeRange("all");
    setStatusFilters([]);
    setCustomDateRange({ from: undefined, to: undefined });
  };

  // Fetch QC reports from API
  const fetchQCReports = useCallback(
    async (page: number, search: string = "", append: boolean = false) => {
      if (!user?.id || loading) return;

      try {
        if (!append) {
          setInitialLoading(true);
        }
        setLoading(true);
        
        const { data } = await apiJson<{
          success: boolean;
          data: QCReport[];
          pagination: PaginationInfo;
        }>(
          "/reports/get-qc-reports",
          {
            method: "POST",
            headers: jsonHeaders,
            body: JSON.stringify({
              userId: user.id,
              page,
              limit: 10,
              search,
              timeRange: timeRange === "custom" ? "custom" : timeRange,
              customStartDate: timeRange === "custom" && customDateRange.from 
                ? customDateRange.from.toISOString() 
                : undefined,
              customEndDate: timeRange === "custom" && customDateRange.to 
                ? customDateRange.to.toISOString() 
                : undefined,
              status: statusFilters,
            }),
          }
        );

        if (data.success) {
          const newReports = data.data;
          setPagination(data.pagination);

          if (append) {
            setReports((prev) => [...prev, ...newReports]);
          } else {
            setReports(newReports);
          }

          setHasMore(data.pagination.hasNextPage);
          calculateStats(append ? [...reports, ...newReports] : newReports);
        }
      } catch (error) {
        console.error("Error fetching QC reports:", error);
      } finally {
        setLoading(false);
        setInitialLoading(false);
      }
    },
    [user?.id, loading, reports, timeRange, statusFilters, customDateRange]
  );

  // Calculate statistics for cards
  const calculateStats = (allReports: QCReport[]) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayEnd = new Date(today);
    todayEnd.setHours(23, 59, 59, 999);

    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59, 999);

    let todayQC = 0;
    let monthlyQC = 0;
    let passedQC = 0;
    let failedQC = 0;

    allReports.forEach((report) => {
      const reportDate = new Date(report.dateTime);

      if (reportDate >= today && reportDate <= todayEnd) {
        todayQC++;
      }

      if (reportDate >= monthStart && reportDate <= monthEnd) {
        monthlyQC++;
      }

      if (report.metadata.failed.count === 0) {
        passedQC++;
      } else {
        failedQC++;
      }
    });

    setCardsMetadata({
      tQC: todayQC,
      mQC: monthlyQC,
      PQC: passedQC,
      FQC: failedQC,
    });
  };

  // Fetch on search or filter change
  useEffect(() => {
    if (user?.id) {
      setCurrentPage(1);
      setHasMore(true);
      fetchQCReports(1, debouncedSearch, false);
    }
  }, [user?.id, debouncedSearch, timeRange, statusFilters, customDateRange]);

  // Infinite scroll observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading && !initialLoading) {
          setCurrentPage((prev) => prev + 1);
        }
      },
      { threshold: 0.1 }
    );

    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }

    return () => {
      if (observerTarget.current) {
        observer.unobserve(observerTarget.current);
      }
    };
  }, [hasMore, loading, initialLoading]);

  // Load more when page changes
  useEffect(() => {
    if (currentPage > 1) {
      fetchQCReports(currentPage, debouncedSearch, true);
    }
  }, [currentPage]);

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    const options: Intl.DateTimeFormatOptions = {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    };
    return date.toLocaleString("en-GB", options);
  };

  return (
    <div className="px-6 py-6">
      {/* Header with icon and title */}
      <div className="flex items-center justify-between gap-4 mb-6 max-[550px]:flex-col max-[550px]:items-start">
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
        <div className=" max-[550px]:w-full max-[550px]:mt-3">
          <Button className="max-[550px]:w-full h-12 ml-auto flex items-center gap-2 bg-[#FFFFFF] border border-[#E2E8F0] text-[#314158] hover:bg-gray-100 hover:border-gray-300 shadow-sm shadow-gray-600/40 radius-[34px] min-[550px]:h-11.5 min-[550px]:w-30">
            <Download />
            <span className="md:block "> Export</span>
          </Button>
        </div>
      </div>

      {/* Search and Filter Bar */}
      <SearchFilterBar
        wrapperClassName="mt-5 flex items-center justify-between max-[550px]:flex-col max-[550px]:items-start max-[550px]:gap-4"
        inputClassName="h-12 pl-10 text-sm caret-slow-blink"
        filterButtonClassName="max-[550px]:w-full max-[550px]:ml-0 ml-4 h-12 w-25 bg-[#000000] text-[#E2E8F0]"
        placeholder="Search by QC Code, IMEI, Employee ID or Device..."
        value={searchValue}
        onValueChange={setSearchValue}
        showFilter={true}
        filterLabel="Filter"
        filterTitle="Filters"
        filterDescription="Apply filters to segregate QC reports"
        filterContent={
          <div className="space-y-6 py-4 px-4">
            {/* Time Range Filter */}
            <div className="space-y-3">
              <Label className="text-sm font-semibold text-gray-700">
                Time Range
              </Label>
              <Select value={timeRange} onValueChange={setTimeRange}>
                <SelectTrigger className="w-full h-11">
                  <SelectValue placeholder="Select time range" />
                </SelectTrigger>
                <SelectContent className="px-3 py-3">
                  <SelectItem value="1month">Last 1 Month</SelectItem>
                  <SelectItem value="3months">Last 3 Months</SelectItem>
                  <SelectItem value="1year">Last 1 Year</SelectItem>
                  <SelectItem value="custom">Custom Range</SelectItem>
                  <SelectItem value="all">All Time</SelectItem>
                </SelectContent>
              </Select>

              {/* Custom Date Range Picker */}
              {timeRange === "custom" && (
                <div className="mt-3 space-y-2">
                  <Popover modal={true}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full h-11 justify-start text-left font-normal",
                          !customDateRange.from && !customDateRange.to && "text-muted-foreground"
                        )}
                      >
                        <CalendarDays className="mr-2 h-4 w-4" />
                        {customDateRange.from && customDateRange.to ? (
                          <>
                            {format(customDateRange.from, "MMM dd, yyyy")} -{" "}
                            {format(customDateRange.to, "MMM dd, yyyy")}
                          </>
                        ) : customDateRange.from ? (
                          format(customDateRange.from, "MMM dd, yyyy")
                        ) : (
                          <span>Select date range</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start" side="bottom" sideOffset={4}>
                      <Calendar
                        mode="range"
                        selected={{
                          from: customDateRange.from,
                          to: customDateRange.to,
                        }}
                        onSelect={(range) => {
                          setCustomDateRange({
                            from: range?.from,
                            to: range?.to,
                          });
                        }}
                        disabled={(date) => date > new Date()}
                        numberOfMonths={2}
                        defaultMonth={customDateRange.from}
                      />
                    </PopoverContent>
                  </Popover>
                  {customDateRange.from && customDateRange.to && (
                    <p className="text-xs text-gray-500">
                      Selected: {format(customDateRange.from, "MMM dd, yyyy")} to{" "}
                      {format(customDateRange.to, "MMM dd, yyyy")}
                    </p>
                  )}
                </div>
              )}
            </div>

            <Separator />

            {/* Status Filter */}
            <div className="space-y-3">
              <Label className="text-sm font-semibold text-gray-700">
                Status
              </Label>
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="passed"
                    checked={statusFilters.includes("passed")}
                    onCheckedChange={(checked) =>
                      handleStatusChange("passed", checked as boolean)
                    }
                  />
                  <label
                    htmlFor="passed"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer flex items-center gap-2"
                  >
                    <div className="w-3 h-3 rounded-full bg-green-500" />
                    Passed
                  </label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="failed"
                    checked={statusFilters.includes("failed")}
                    onCheckedChange={(checked) =>
                      handleStatusChange("failed", checked as boolean)
                    }
                  />
                  <label
                    htmlFor="failed"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer flex items-center gap-2"
                  >
                    <div className="w-3 h-3 rounded-full bg-red-500" />
                    Failed
                  </label>
                </div>
              </div>
            </div>

            <Separator />

            {/* Clear Filters Button */}
            <Button
              variant="outline"
              onClick={handleClearFilters}
              className="w-full"
              disabled={
                timeRange === "all" && 
                statusFilters.length === 0 && 
                !customDateRange.from && 
                !customDateRange.to
              }
            >
              Clear All Filters
            </Button>
          </div>
        }
        enableAutocomplete={false}
      />

      {/* Stats Layer */}
      <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        <Card className="h-26.25 rounded-[16px] bg-[#FFFFFF] border border-[#E2E8F0] drop-shadow-md p-4 flex justify-center items-center">
          <div className="w-full flex gap-5">
            <div className="w-[48px] h-[48px] rounded-full bg-[#DCDCDC] text-[#080341] flex justify-center items-center">
              <Clock />
            </div>
            <div className="flex flex-col">
              <span className="text-[#45556C] font-medium text-[16px] font-inter">
                Today's QC
              </span>
              <span className="text-[#0F172B] text-[24px] font-bold">
                {cardsMetaData.tQC}
              </span>
            </div>
          </div>
        </Card>
        <Card className="h-26.25 rounded-[16px] bg-[#FFFFFF] border border-[#E2E8F0] drop-shadow-md p-4 flex justify-center items-center">
          <div className="w-full flex gap-5">
            <div className="w-[48px] h-[48px] rounded-full bg-[#DCDCDC] text-[#080341] flex justify-center items-center">
              <CalendarIcon />
            </div>
            <div className="flex flex-col">
              <span className="text-[#45556C] font-medium text-[16px] font-inter">
                Monthly QC
              </span>
              <span className="text-[#0F172B] text-[24px] font-bold">
                {cardsMetaData.mQC}
              </span>
            </div>
          </div>
        </Card>
        <Card className="h-26.25 rounded-[16px] bg-[#FFFFFF] border border-[# flex gap-5E2E8F0] drop-shadow-md p-4 flex justify-center items-center">
          <div className="w-full flex gap-5">
            <div className="w-[48px] h-[48px] rounded-full bg-[#DCFCE7] text-[#00A63E] flex justify-center items-center">
              <CircleCheckBig />
            </div>
            <div className="flex flex-col">
              <span className="text-[#45556C] font-medium text-[16px] font-inter">
                Passed
              </span>
              <span className="text-[#0F172B] text-[24px] font-bold">
                {cardsMetaData.PQC}
              </span>
            </div>
          </div>
        </Card>
        <Card className="h-26.25 rounded-[16px] bg-[#FFFFFF] border border-[# flex gap-5E2E8F0] drop-shadow-md p-4 flex justify-center items-center">
          <div className="w-full flex gap-5">
            <div className="w-[48px] h-[48px] rounded-full bg-[#FFE2E2] text-[#C10007] flex justify-center items-center">
              <CircleX />
            </div>
            <div className="flex flex-col">
              <span className="text-[#45556C] font-medium text-[16px] font-inter">
                Failed
              </span>
              <span className="text-[#0F172B] text-[24px] font-bold">
                {cardsMetaData.FQC}
              </span>
            </div>
          </div>
        </Card>
      </div>

      {/* Main Data Layer */}
      {initialLoading ? (
        <div className="mt-10 flex justify-center items-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-[#009966]" />
        </div>
      ) : reports.length === 0 ? (
        <div className="mt-10 flex justify-center items-center py-20">
          <p className="text-gray-500 text-lg">
            {debouncedSearch ? "No reports found matching your search" : "No QC reports available"}
          </p>
        </div>
      ) : (
        <>
          <div className="mt-10 space-y-4">
            {reports.map((report) => (
              <Card
                key={report.id}
                onClick={() => {route('/reports/qc-reports/view/' + report.exchangeCode)}}
                className="rounded-[16px] py-6 px-8 hover:bg-gray-50 transition-colors hover:cursor-pointer"
              >
                <div className="flex lg:flex-row flex-col lg:gap-3 gap-6 justify-between items-start lg:items-center">
                  <div className="flex flex-col gap-2">
                    <span className="text-[#000000] text-[20px] font-semibold">
                      {report.model}
                    </span>
                    <span className="text-[#949494] text-[16px] font-semibold">
                      IMEI: {report.imei1}
                      {report.imei2 && ` / ${report.imei2}`}
                    </span>
                    <div className="flex flex-col">
                      <span className="text-[#222121] font-medium text-[16px] flex gap-2">
                        Exchange Code:{" "}
                        <div className="bg-[#6696FF] rounded-[19px] text-white px-3 h-[24px] flex items-center justify-center">
                          {report.exchangeCode}
                        </div>
                      </span>
                      <div className="flex gap-3 items-center mt-1.5 max-[550px]:flex-col max-[550px]:items-start max-[550px]:gap-1">
                        <span className="text-[14px] font-medium text-[#9C9C9C]">
                          Name:{" "}
                          <span className="font-normal">{report.employeeName}</span>
                        </span>
                        <Separator orientation="vertical" className="h-2 max-[550px]:hidden" />
                        <span className="text-[14px] font-medium text-[#9C9C9C]">
                          Employee ID:{" "}
                          <span className="font-normal">{report.employeeId}</span>
                        </span>
                        <Separator orientation="vertical" className="h-2 max-[550px]:hidden" />
                        <span className="text-[14px] font-medium text-[#9C9C9C]">
                          Date & Time:{" "}
                          <span className="font-normal">
                            {formatDateTime(report.dateTime)}
                          </span>
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex lg:flex-col flex-row gap-3 max-lg:w-full max-lg:justify-end max-[470px]:flex-col">
                    <Badge className="w-40.25 h-12.5 max-[470px]:w-full rounded-[40px] bg-[#DFFFEA] flex justify-center items-center text-[#00A63E] gap-2">
                      <CircleCheck className="" />{" "}
                      <span className="text-[16px] font-bold">
                        Passed: {report.metadata.passed.count}
                      </span>
                    </Badge>
                    <Badge className="w-40.25 h-12.5 max-[470px]:w-full rounded-[40px] bg-[#FFE2E2] flex justify-center items-center text-[#C10007] gap-2">
                      <CircleX size={19} />{" "}
                      <span className="text-[16px] font-bold">
                        Failed: {report.metadata.failed.count}
                      </span>
                    </Badge>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {/* Loading indicator for pagination */}
          {loading && !initialLoading && (
            <div className="mt-6 flex justify-center items-center py-4">
              <Loader2 className="w-6 h-6 animate-spin text-[#009966]" />
            </div>
          )}

          {/* Intersection observer target */}
          <div ref={observerTarget} className="h-4 mt-4" />

          {/* End of results indicator */}
          {!hasMore && reports.length > 0 && (
            <div className="mt-6 mb-4 text-center text-gray-500">
              <p>You've reached the end of the reports</p>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default QCReports;

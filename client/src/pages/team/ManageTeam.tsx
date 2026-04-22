import EmployeeSearchBar from "@/components/common/EmployeeSearchBar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import employeeData from "./components/data.json";
import {
  Download,
  Calendar as CircleCheckBig,
  UsersRound,
  Check,
} from "lucide-react";
import { useEffect, useState } from "react";
import { EmployeeDataTable } from "./components/data-table.";

const ManageTeam = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [cardsMetaData, setCardsMetadata] = useState({
    actUsers: 0,
    inactUsers: 0,
    TEmps: 0,
    TStores: 0,
  });

  useEffect(() => {
    // Calculate metadata for cards
    const activeUsers = employeeData.employees.filter(
      (emp) => emp.status === "Active",
    ).length;
    const inactiveUsers = employeeData.employees.filter(
      (emp) => emp.status === "Inactive",
    ).length;
    const totalEmployees = employeeData.employees.length;
    const totalStores = employeeData.stores.length;
    setCardsMetadata({
      actUsers: activeUsers,
      inactUsers: inactiveUsers,
      TEmps: totalEmployees,
      TStores: totalStores,
    });
  }, [employeeData]);
  return (
    <div className="px-6 py-6">
      <div className="flex items-center justify-between gap-4 mb-6 max-[550px]:flex-col max-[550px]:items-start">
        {/* Wallet Icon with gradient background */}
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-linear-to-br from-[#7F22FE] to-[#7008E7] flex items-center justify-center">
            <UsersRound className="w-6 h-6 text-white" />
          </div>

          {/* Title and subtitle */}
          <div className="flex flex-col">
            <h1 className="text-2xl font-bold">Employees</h1>
            <p className="text-[#62748E] text-base font-normal">
              Manage your team members
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

      <EmployeeSearchBar
        wrapperClassName="mt-5 flex items-center justify-between gap-4 max-[550px]:flex-col max-[550px]:items-start max-[550px]:gap-4"
        value={searchTerm}
        onValueChange={setSearchTerm}
      />

      {/* Stats Layer */}
      <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        <Card className="h-26.25 rounded-[16px] bg-[#FFFFFF] border border-[#E2E8F0] drop-shadow-md p-4 flex justify-center items-center">
          <div className="w-full flex gap-5">
            <div className="w-[48px] h-[48px] rounded-full bg-[#DCFCE7] text-[#00A63E] flex justify-center items-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
                className="lucide lucide-circle-check-big-icon lucide-circle-check-big"
              >
                <path d="M21.801 10A10 10 0 1 1 17 3.335" />
                <path d="m9 11 3 3L22 4" />
              </svg>
            </div>
            <div className="flex flex-col">
              <span className="text-[#45556C] font-medium text-[16px] font-inter">
                Active Users
              </span>
              <span className="text-[#0F172B] text-[24px] font-bold">
                {cardsMetaData.actUsers}
              </span>
            </div>
          </div>
        </Card>
        <Card className="h-26.25 rounded-[16px] bg-[#FFFFFF] border border-[#E2E8F0] drop-shadow-md p-4 flex justify-center items-center">
          <div className="w-full flex gap-5">
            <div className="w-[48px] h-[48px] rounded-full bg-[#DCFCE7] text-[#00A63E] flex justify-center items-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
                className="lucide lucide-circle-check-big-icon lucide-circle-check-big"
              >
                <path d="M21.801 10A10 10 0 1 1 17 3.335" />
                <path d="m9 11 3 3L22 4" />
              </svg>
            </div>
            <div className="flex flex-col">
              <span className="text-[#45556C] font-medium text-[16px] font-inter">
                Inactive Users
              </span>
              <span className="text-[#0F172B] text-[24px] font-bold">
                {cardsMetaData.inactUsers}
              </span>
            </div>
          </div>
        </Card>
        <Card className="h-26.25 rounded-[16px] bg-[#FFFFFF] border border-[#5E2E8F0] drop-shadow-md p-4 flex justify-center items-center">
          <div className="w-full flex gap-5">
            <div className="w-12 h-12 rounded-full bg-[#DCFCE7] text-[#00A63E] flex justify-center items-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
                className="lucide lucide-circle-check-big-icon lucide-circle-check-big"
              >
                <path d="M21.801 10A10 10 0 1 1 17 3.335" />
                <path d="m9 11 3 3L22 4" />
              </svg>
            </div>
            <div className="flex flex-col">
              <span className="text-[#45556C] font-medium text-[16px] font-inter">
                Total Employees
              </span>
              <span className="text-[#0F172B] text-[24px] font-bold">
                {cardsMetaData.TEmps}
              </span>
            </div>
          </div>
        </Card>
        <Card className="h-26.25 rounded-[16px] bg-[#FFFFFF] border border-[#gap-5E2E8F0] drop-shadow-md p-4 flex justify-center items-center">
          <div className="w-full flex gap-5">
            <div className="w-12 h-12 rounded-full bg-[#DCFCE7] text-[#00A63E] flex justify-center items-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
                className="lucide lucide-circle-check-big-icon lucide-circle-check-big"
              >
                <path d="M21.801 10A10 10 0 1 1 17 3.335" />
                <path d="m9 11 3 3L22 4" />
              </svg>
            </div>
            <div className="flex flex-col">
              <span className="text-[#45556C] font-medium text-[16px] font-inter">
                Total Stores
              </span>
              <span className="text-[#0F172B] text-[24px] font-bold">
                {cardsMetaData.TStores}
              </span>
            </div>
          </div>
        </Card>
      </div>

      {/* Employee List Layer */}
      <div className="mt-10">
        <EmployeeDataTable data={employeeData} />
      </div>
    </div>
  );
};

export default ManageTeam;

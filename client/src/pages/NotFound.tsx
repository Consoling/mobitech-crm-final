import { Button } from "@/components/ui/button";
import { ArrowLeft, SearchX } from "lucide-react";
const NotFound = () => {
  return (
    <div className="h-screen flex flex-col items-center justify-center gap-5">
      <SearchX
        size={150}
        className="text-[#62748E] shadow-2xl bg-transparent rounded-full fill-red-600/20"
      />
      <div className="flex flex-col justify-center items-center gap-2">
        <p className="font-extrabold text-5xl text-red-700">404</p>
        <span className="text-2xl font-semibold text-gray-500 ">
          Nahi milega bhai, mtt dekho...
        </span>
        <Button className="mt-3">
          <ArrowLeft /> <a href="/">Go to Home Page</a>
        </Button>
      </div>
    </div>
  );
};

export default NotFound;

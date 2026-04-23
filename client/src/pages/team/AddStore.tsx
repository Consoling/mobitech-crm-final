import { Store } from "lucide-react"


const AddStore = () => {
  return (
     <div className="px-6 py-6">
      <div className="flex items-center justify-between gap-4 mb-6 max-[550px]:flex-col max-[550px]:items-start">
        {/* User Icon with gradient background */}
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-linear-to-br from-[#7F22FE] to-[#7008E7] flex items-center justify-center">
            <Store className="w-6 h-6 text-white" />
          </div>

          {/* Title and subtitle */}
          <div className="flex flex-col">
            <h1 className="text-2xl font-bold">Add New Stores</h1>
            <p className="text-[#62748E] text-base font-normal">
              Complete the form to register a new store
            </p>
          </div>
        </div>
       
      </div>
    </div>
  )
}

export default AddStore
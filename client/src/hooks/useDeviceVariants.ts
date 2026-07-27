import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { addDeviceVariant, getDeviceVariants } from "../api/deviceVariant";

export const useDeviceVariants = () =>
  useQuery({
    queryKey: ["device-variants"],
    queryFn: getDeviceVariants,
  });


  export const useAddDeviceVariant = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: addDeviceVariant,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["device-variants"],
      });
    },
  });
};
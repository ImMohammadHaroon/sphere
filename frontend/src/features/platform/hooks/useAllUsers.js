import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { listAllUsers } from "@/lib/platformApi";
import { useAuth } from "@/hooks/useAuth";

export function useAllUsers(filters) {
  const { isAuthenticated, user } = useAuth();

  return useQuery({
    queryKey: ["platform", "users", filters],
    queryFn: () => listAllUsers(filters),
    staleTime: 30_000,
    placeholderData: keepPreviousData,
    enabled: isAuthenticated && user?.role === "super_admin",
  });
}

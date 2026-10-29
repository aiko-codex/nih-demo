import { useQuery } from "@tanstack/react-query";
import { apiGet } from "@/lib/api";

export function useBuilding() {
  return useQuery({
    queryKey: ["building"],
    queryFn: () => apiGet("/building"),
  });
}

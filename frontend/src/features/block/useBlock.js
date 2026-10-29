import { useQuery } from "@tanstack/react-query";
import { apiGet } from "@/lib/api";

export function useBlock(code) {
  return useQuery({ queryKey: ["block", code], queryFn: () => apiGet(`/blocks/${encodeURIComponent(code)}`), enabled: Boolean(code) });
}

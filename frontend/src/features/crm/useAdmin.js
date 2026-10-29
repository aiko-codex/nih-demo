import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  apiDelete,
  apiGet,
  apiPost,
  apiPut,
  apiUpload,
  setCsrfToken,
} from "@/lib/api";

const qk = ["admin"];
function saveCsrf(result) {
  if (result?.csrfToken) setCsrfToken(result.csrfToken);
  return result;
}
export function useMe(options = {}) {
  return useQuery({
    queryKey: [...qk, "me"],
    queryFn: async () => saveCsrf(await apiGet("/admin/me")),
    retry: false,
    ...options,
  });
}
export function useLogin() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body) => saveCsrf(await apiPost("/admin/login", body)),
    onSuccess: (data) => qc.setQueryData([...qk, "me"], data),
  });
}
export function useLogout() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => apiPost("/admin/logout", {}),
    onSuccess: () => {
      setCsrfToken("");
      qc.clear();
    },
  });
}
export function useStats() {
  return useQuery({
    queryKey: [...qk, "stats"],
    queryFn: () => apiGet("/admin/stats"),
  });
}
export function useBlocks() {
  return useQuery({
    queryKey: [...qk, "blocks"],
    queryFn: () => apiGet("/admin/blocks"),
  });
}
export function useBlock(id) {
  return useQuery({
    queryKey: [...qk, "blocks", id],
    queryFn: () => apiGet(`/admin/blocks/${id}`),
    enabled: Boolean(id),
  });
}
export function useSaveBlock() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...body }) =>
      id ? apiPut(`/admin/blocks/${id}`, body) : apiPost("/admin/blocks", body),
    onSuccess: () => qc.invalidateQueries({ queryKey: [...qk, "blocks"] }),
  });
}
export function useDeleteBlock() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => apiDelete(`/admin/blocks/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: [...qk, "blocks"] }),
  });
}
export function useUploadMedia() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, formData, onProgress }) =>
      apiUpload(`/admin/blocks/${id}/media`, formData, onProgress),
    onSuccess: (_, variables) =>
      queryClient.invalidateQueries({
        queryKey: [...qk, "blocks", variables.id],
      }),
  });
}
export function useEmbedMedia() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, embedUrl }) =>
      apiPost(`/admin/blocks/${id}/media`, { kind: "embed", embedUrl }),
    onSuccess: (_, variables) =>
      queryClient.invalidateQueries({
        queryKey: [...qk, "blocks", variables.id],
      }),
  });
}
export function useUpdateMedia() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, blockId, ...body }) =>
      apiPut(`/admin/media/${id}`, body),
    onSuccess: (_, variables) =>
      queryClient.invalidateQueries({
        queryKey: [...qk, "blocks", variables.blockId],
      }),
  });
}
export function useDeleteMedia() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id }) => apiDelete(`/admin/media/${id}`),
    onSuccess: (_, variables) =>
      queryClient.invalidateQueries({
        queryKey: [...qk, "blocks", variables.blockId],
      }),
  });
}
export function useReorderMedia() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ blockId, ids }) =>
      apiPost(`/admin/blocks/${blockId}/media/reorder`, { ids }),
    onSuccess: (_, variables) =>
      queryClient.invalidateQueries({
        queryKey: [...qk, "blocks", variables.blockId],
      }),
  });
}
export function useSetCover() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ blockId, mediaId }) =>
      apiPut(`/admin/blocks/${blockId}/cover`, { mediaId }),
    onSuccess: (_, variables) =>
      queryClient.invalidateQueries({
        queryKey: [...qk, "blocks", variables.blockId],
      }),
  });
}
export function useDonations(params = {}) {
  const query = new URLSearchParams(
    Object.entries(params).filter(([, value]) => value !== "" && value != null),
  );
  return useQuery({
    queryKey: [...qk, "donations", params],
    queryFn: () => apiGet(`/admin/donations?${query}`),
  });
}
export function donationExportUrl(params = {}) {
  const query = new URLSearchParams(
    Object.entries(params).filter(([, value]) => value !== "" && value != null),
  );
  const apiBase = import.meta.env.VITE_API_BASE || "/api";
  return `${apiBase}/admin/donations/export.csv?${query}`;
}
export function useUpdateDonation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...body }) => apiPut(`/admin/donations/${id}`, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: [...qk, "donations"] }),
  });
}
export function useSettings() {
  return useQuery({
    queryKey: [...qk, "settings"],
    queryFn: () => apiGet("/admin/settings"),
  });
}
export function useSaveSettings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body) => apiPut("/admin/settings", body),
    onSuccess: () => qc.invalidateQueries({ queryKey: [...qk, "settings"] }),
  });
}

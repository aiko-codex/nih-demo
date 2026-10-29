import { Navigate, useLocation } from "react-router";
import { useMe } from "./useAdmin";
import CrmLayout from "./CrmLayout";

export default function RequireAdmin() {
  const { data, isLoading, error } = useMe();
  const location = useLocation();
  if (isLoading)
    return (
      <div className="p-8 text-muted-foreground">Checking your session…</div>
    );
  if (error?.status === 401 || (!error && !data?.admin))
    return <Navigate to="/crm/login" replace state={{ from: location }} />;
  if (error)
    return <main className="p-8 text-destructive">{error.message}</main>;
  return <CrmLayout />;
}

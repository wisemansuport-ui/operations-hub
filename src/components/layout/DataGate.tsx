import { ReactNode } from "react";
import { LoadingScreen } from "@/components/LoadingScreen";

interface DataGateProps {
  loading: boolean;
  message?: string;
  children: ReactNode;
}

/**
 * Standard loading gate for pages backed by useFirestoreData / async hooks.
 *
 * IMPORTANT — Rules of Hooks:
 * Do NOT use `if (loading) return <LoadingScreen />` in page components.
 * That pattern is fragile: any hook (useMemo/useEffect/useState) added
 * below the guard silently breaks React's hook ordering on the first
 * render after `loading` flips to false.
 *
 * Instead, declare ALL hooks at the top of your component and wrap the
 * final JSX with <DataGate loading={loading}>. The gate switches between
 * the loader and content inside render — no early return, no hook risk.
 *
 * Usage:
 *   const { metas, loading } = useFirestoreData();
 *   const derived = useMemo(() => ..., [metas]);
 *   return (
 *     <DataGate loading={loading} message="Sincronizando seus dados">
 *       <YourPage ... />
 *     </DataGate>
 *   );
 */
export const DataGate = ({ loading, message, children }: DataGateProps) => {
  if (loading) return <LoadingScreen message={message} />;
  return <>{children}</>;
};

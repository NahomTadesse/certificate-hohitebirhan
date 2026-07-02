// hooks/useNavigate.ts
import { useRouter } from "next/navigation";

export const useNavigate = () => {
  const router = useRouter();

  return (path: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    router.prefetch(path);
 "next/navigation";
    router.push(path);
  };
};
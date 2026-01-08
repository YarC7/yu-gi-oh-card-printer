import {
  useState,
  useEffect,
  createContext,
  useContext,
  ReactNode,
} from "react";
import { BanListInfo } from "@/types/card";
import { getBanList } from "@/lib/ygoprodeck-api";

interface BanListContextType {
  banList: BanListInfo[];
  loading: boolean;
  error: string | null;
  format: "TCG" | "OCG";
  setFormat: (format: "TCG" | "OCG") => void;
  getBanStatus: (
    cardId: number,
    format?: "TCG" | "OCG"
  ) => "Banned" | "Limited" | "Semi-Limited" | null;
}

const BanListContext = createContext<BanListContextType | undefined>(undefined);

export function BanListProvider({ children }: { children: ReactNode }) {
  const [banList, setBanList] = useState<BanListInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [format, setFormat] = useState<"TCG" | "OCG">("TCG");

  useEffect(() => {
    const fetchBanList = async () => {
      try {
        setLoading(true);
        const data = await getBanList(format);
        setBanList(data);
        setError(null);
      } catch (err) {
        setError("Failed to load ban list");
        console.error("Error loading ban list:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchBanList();
  }, [format]);

  const getBanStatus = (
    cardId: number,
    overrideFormat?: "TCG" | "OCG"
  ): "Banned" | "Limited" | "Semi-Limited" | null => {
    const banInfo = banList.find((b) => b.cardId === cardId);
    if (!banInfo) return null;
    const currentFormat = overrideFormat || format;
    return currentFormat === "TCG" ? banInfo.ban_tcg : banInfo.ban_ocg;
  };

  return (
    <BanListContext.Provider
      value={{ banList, loading, error, format, setFormat, getBanStatus }}
    >
      {children}
    </BanListContext.Provider>
  );
}

export function useBanList() {
  const context = useContext(BanListContext);
  if (context === undefined) {
    throw new Error("useBanList must be used within a BanListProvider");
  }
  return context;
}

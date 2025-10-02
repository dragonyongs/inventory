import { useState, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import type { ImportProgress, ParsedRow } from "../types";
import { useItemsStore } from "@/stores/itemsStore";
import { useCreateMovement } from "@/hooks/useCreateMovement";
import { CHUNK_SIZE } from "../constants";
import { isRowValid } from "../utils/validation";

export const useBulkImport = () => {
  const navigate = useNavigate();
  const addItem = useItemsStore((s) => s.addItem);
  const createMovement = useCreateMovement();
  const abortControllerRef = useRef<AbortController | null>(null);

  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState<ImportProgress>({
    current: 0,
    total: 0,
    percentage: 0,
    status: "idle",
  });

  const handleBulkApply = useCallback(
    async (rows: ParsedRow[], onError?: (error: string) => void) => {
      const validRows = rows.filter(isRowValid);

      if (validRows.length === 0) {
        onError?.("적용할 유효한 데이터가 없습니다");
        return;
      }

      setImporting(true);
      abortControllerRef.current = new AbortController();
      setProgress({
        current: 0,
        total: validRows.length,
        percentage: 0,
        status: "processing",
      });

      // Split into chunks for better performance
      const chunks: ParsedRow[][] = [];
      for (let i = 0; i < validRows.length; i += CHUNK_SIZE) {
        chunks.push(validRows.slice(i, i + CHUNK_SIZE));
      }

      try {
        let processedCount = 0;

        for (const chunk of chunks) {
          // Check if cancelled
          if (abortControllerRef.current?.signal.aborted) {
            throw new Error("사용자가 작업을 취소했습니다");
          }

          // Process chunk
          for (const row of chunk) {
            const item = addItem({
              name: row.name,
              sku: row.sku,
              barcode: row.barcode,
              minStock: row.minQty || 0,
              defaultPrice: row.price,
              stock: 0,
              expiryDate: row.expiryDate,
              batchNumber: row.batchNumber,
              receivedDate: row.receivedDate,
            });

            // Create movement if qty > 0
            if (row.qty && row.qty > 0) {
              await createMovement({
                type: "IN",
                itemId: item.id,
                qty: row.qty,
                reason: "일괄 업로드",
              });
            }

            processedCount++;
            setProgress({
              current: processedCount,
              total: validRows.length,
              percentage: Math.round((processedCount / validRows.length) * 100),
              status: "processing",
            });
          }

          // Small delay for UI responsiveness
          await new Promise((resolve) => setTimeout(resolve, 0));
        }

        setProgress((prev) => ({ ...prev, status: "completed" }));

        // Navigate after short delay
        setTimeout(() => {
          navigate("/inventory", { replace: true });
        }, 1000);
      } catch (error) {
        console.error("일괄 적용 실패:", error);
        setProgress((prev) => ({ ...prev, status: "error" }));
        onError?.(
          error instanceof Error
            ? error.message
            : "일괄 적용 중 오류가 발생했습니다"
        );
      } finally {
        setImporting(false);
        abortControllerRef.current = null;
      }
    },
    [addItem, createMovement, navigate]
  );

  const handleCancel = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  }, []);

  return {
    importing,
    progress,
    handleBulkApply,
    handleCancel,
  };
};

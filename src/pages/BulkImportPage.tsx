import React from "react";
import { BulkImportView } from "@/features/bulk-import/BulkImportView";

/**
 * Bulk Import Page
 *
 * This is a thin routing layer that simply renders the feature view.
 * All business logic and UI are contained in the feature module.
 */
export const BulkImportPage: React.FC = () => {
  return <BulkImportView />;
};

export default BulkImportPage;

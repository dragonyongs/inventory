/**
 * Format file size in human-readable format
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return "0 B";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

/**
 * Format duration in Korean
 */
export const formatDuration = (ms: number): string => {
  if (ms < 1000) return `${ms}ms`;

  const seconds = Math.floor(ms / 1000);
  if (seconds < 60) return `${seconds}초`;

  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;

  return remainingSeconds > 0
    ? `${minutes}분 ${remainingSeconds}초`
    : `${minutes}분`;
};

/**
 * Format price in Korean Won
 */
export const formatPrice = (price?: number): string => {
  if (price === undefined || price === null) return "-";
  return `₩${price.toLocaleString("ko-KR")}`;
};

/**
 * Format number with commas
 */
export const formatNumber = (num: number): string => {
  return num.toLocaleString("ko-KR");
};

/**
 * Format date to Korean format
 */
export const formatDate = (date?: string): string => {
  if (!date) return "-";

  try {
    const d = new Date(date);
    return d.toLocaleDateString("ko-KR", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
  } catch {
    return date;
  }
};

/**
 * Truncate text with ellipsis
 */
export const truncate = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength)}...`;
};

/**
 * Get file extension
 */
export const getFileExtension = (filename: string): string => {
  return filename.slice(filename.lastIndexOf(".")).toLowerCase();
};

/**
 * Generate unique filename with timestamp
 */
export const generateFilename = (prefix: string, extension: string): string => {
  const timestamp = new Date().toISOString().split("T")[0];
  return `${prefix}_${timestamp}${extension}`;
};

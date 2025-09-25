// src/utils/qrcode.ts

import QRCode from "qrcode";

export interface QRCodeOptions {
  width?: number;
  margin?: number;
  color?: {
    dark?: string;
    light?: string;
  };
}

export const generateQRCode = async (
  text: string,
  options: QRCodeOptions = {}
): Promise<string> => {
  try {
    const defaultOptions = {
      width: 256,
      margin: 2,
      color: {
        dark: "#000000",
        light: "#FFFFFF",
      },
      ...options,
    };

    const qrCodeDataURL = await QRCode.toDataURL(text, defaultOptions);
    return qrCodeDataURL;
  } catch (error) {
    console.error("QR 코드 생성 실패:", error);
    throw new Error("QR 코드를 생성할 수 없습니다.");
  }
};

export const downloadQRCode = (dataURL: string, filename = "qrcode.png") => {
  const link = document.createElement("a");
  link.download = filename;
  link.href = dataURL;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

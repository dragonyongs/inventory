// src/services/dropboxService.ts
import type { ItemImage } from "@/types/image";

const DROPBOX_APP_KEY = import.meta.env.VITE_DROPBOX_APP_KEY || "";
const DROPBOX_REDIRECT_URI =
  import.meta.env.VITE_DROPBOX_REDIRECT_URI || window.location.origin;

interface DropboxTokens {
  accessToken: string;
  refreshToken?: string;
  expiresAt?: number;
}

class DropboxService {
  private tokens: DropboxTokens | null = null;

  constructor() {
    this.loadTokens();
    // ✅ 추가: 환경변수에서 토큰 자동 로드 및 저장
    if (
      !this.tokens?.accessToken &&
      import.meta.env.VITE_DROPBOX_ACCESS_TOKEN
    ) {
      console.log("환경변수에서 Dropbox 토큰을 로드합니다...");
      this.saveTokens({
        accessToken: import.meta.env.VITE_DROPBOX_ACCESS_TOKEN,
      });
    }
  }

  // 로컬스토리지에서 토큰 로드
  private loadTokens() {
    const stored = localStorage.getItem("dropbox-tokens");
    if (stored) {
      try {
        this.tokens = JSON.parse(stored);
      } catch (e) {
        console.error("토큰 로드 실패:", e);
      }
    }
  }

  // 토큰 저장
  private saveTokens(tokens: DropboxTokens) {
    this.tokens = tokens;
    localStorage.setItem("dropbox-tokens", JSON.stringify(tokens));
  }

  // OAuth 인증 시작
  public startAuth() {
    const authUrl = `https://www.dropbox.com/oauth2/authorize?client_id=${DROPBOX_APP_KEY}&response_type=code&redirect_uri=${encodeURIComponent(
      DROPBOX_REDIRECT_URI
    )}`;
    window.location.href = authUrl;
  }

  // 인증 코드로 액세스 토큰 교환
  public async exchangeCodeForToken(_code: string): Promise<void> {
    // 실제 구현 시 백엔드 API를 통해 처리해야 함 (클라이언트 시크릿 노출 방지)
    console.warn("토큰 교환은 백엔드에서 처리해야 합니다");

    // 임시로 하드코딩된 토큰 사용 (개발용)
    this.saveTokens({
      accessToken: "YOUR_DROPBOX_ACCESS_TOKEN",
    });
  }

  // 인증 여부 확인
  public isAuthenticated(): boolean {
    return !!this.tokens?.accessToken;
  }

  // 파일 업로드
  public async uploadFile(
    file: File,
    itemId: string,
    onProgress?: (progress: number) => void
  ): Promise<ItemImage> {
    if (!this.isAuthenticated()) {
      throw new Error("Dropbox 인증이 필요합니다");
    }

    const fileName = `${Date.now()}_${file.name}`;
    const path = `/${itemId}/${fileName}`;

    try {
      // 파일 업로드 (Dropbox API v2)
      const response = await fetch(
        "https://content.dropboxapi.com/2/files/upload",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${this.tokens!.accessToken}`,
            "Dropbox-API-Arg": JSON.stringify({
              path,
              mode: "add",
              autorename: true,
              mute: false,
            }),
            "Content-Type": "application/octet-stream",
          },
          body: file,
        }
      );

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`업로드 실패: ${error}`);
      }

      const data = await response.json();

      // 공유 링크 생성
      const directUrl = await this.createSharedLink(data.path_display);

      const itemImage: ItemImage = {
        id: globalThis.crypto?.randomUUID?.() ?? `img_${Date.now()}`,
        itemId,
        dropboxPath: data.path_display,
        directUrl,
        fileName: data.name,
        fileSize: file.size,
        uploadedAt: new Date().toISOString(),
        isPrimary: false,
      };

      onProgress?.(100);
      return itemImage;
    } catch (error) {
      console.error("Dropbox 업로드 실패:", error);
      throw error;
    }
  }

  // 공유 링크 생성 및 직접 URL로 변환
  private async createSharedLink(path: string): Promise<string> {
    try {
      const response = await fetch(
        "https://api.dropboxapi.com/2/sharing/create_shared_link_with_settings",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${this.tokens!.accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            path,
            settings: {
              requested_visibility: "public",
            },
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        console.error("공유 링크 생성 API 실패:", {
          status: response.status,
          statusText: response.statusText,
          error: errorData,
        });

        // ✅ shared_link_already_exists 에러 처리
        if (errorData.error?.[".tag"] === "shared_link_already_exists") {
          console.log("이미 공유 링크가 존재합니다. 기존 링크를 가져옵니다...");
          const existingLink =
            errorData.error?.shared_link_already_exists?.metadata?.url;
          if (existingLink) {
            return this.convertToDirectUrl(existingLink);
          }
        }

        // 기존 링크 목록에서 찾기 시도
        const existingLinks = await this.listSharedLinks(path);
        console.log("기존 공유 링크 목록:", existingLinks);

        if (existingLinks.length > 0) {
          return this.convertToDirectUrl(existingLinks[0].url);
        }

        throw new Error(`공유 링크 생성 실패: ${JSON.stringify(errorData)}`);
      }

      const data = await response.json();
      return this.convertToDirectUrl(data.url);
    } catch (error) {
      console.error("공유 링크 생성 실패:", error);
      throw error;
    }
  }

  // 기존 공유 링크 목록 가져오기
  private async listSharedLinks(path: string): Promise<any[]> {
    const response = await fetch(
      "https://api.dropboxapi.com/2/sharing/list_shared_links",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.tokens!.accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ path }),
      }
    );

    if (!response.ok) {
      return [];
    }

    const data = await response.json();
    return data.links || [];
  }

  // www.dropbox.com URL을 dl.dropboxusercontent.com으로 변환
  private convertToDirectUrl(shareUrl: string): string {
    return shareUrl
      .replace("www.dropbox.com", "dl.dropboxusercontent.com")
      .replace("?dl=0", "?raw=1");
  }

  // 파일 삭제
  public async deleteFile(dropboxPath: string): Promise<void> {
    if (!this.isAuthenticated()) {
      throw new Error("Dropbox 인증이 필요합니다");
    }

    try {
      const response = await fetch(
        "https://api.dropboxapi.com/2/files/delete_v2",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${this.tokens!.accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ path: dropboxPath }),
        }
      );

      if (!response.ok) {
        throw new Error("파일 삭제 실패");
      }
    } catch (error) {
      console.error("Dropbox 파일 삭제 실패:", error);
      throw error;
    }
  }

  // 로그아웃
  public logout() {
    this.tokens = null;
    localStorage.removeItem("dropbox-tokens");
  }
}

export const dropboxService = new DropboxService();

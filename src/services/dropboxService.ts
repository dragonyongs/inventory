// src/services/dropboxService.ts
import type { ItemImage } from "@/types/image";

const DROPBOX_APP_KEY = import.meta.env.VITE_DROPBOX_APP_KEY || "";
const DROPBOX_APP_SECRET = import.meta.env.VITE_DROPBOX_APP_SECRET || "";
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

    // ✅ 환경변수에서 리프레시 토큰 로드
    if (
      !this.tokens?.refreshToken &&
      import.meta.env.VITE_DROPBOX_REFRESH_TOKEN
    ) {
      console.log("환경변수에서 Dropbox 리프레시 토큰을 로드합니다...");
      this.saveTokens({
        accessToken: "", // 빈 값으로 초기화
        refreshToken: import.meta.env.VITE_DROPBOX_REFRESH_TOKEN,
        expiresAt: 0,
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

  // ✅ 토큰 만료 확인
  private isTokenExpired(): boolean {
    if (!this.tokens?.expiresAt) return true;
    // 만료 5분 전에 갱신
    return Date.now() >= this.tokens.expiresAt - 5 * 60 * 1000;
  }

  // ✅ 액세스 토큰 갱신
  private async refreshAccessToken(): Promise<void> {
    if (!this.tokens?.refreshToken) {
      throw new Error("리프레시 토큰이 없습니다");
    }

    try {
      const params = new URLSearchParams({
        grant_type: "refresh_token",
        refresh_token: this.tokens.refreshToken,
      });

      const response = await fetch("https://api.dropboxapi.com/oauth2/token", {
        method: "POST",
        headers: {
          Authorization: `Basic ${btoa(
            `${DROPBOX_APP_KEY}:${DROPBOX_APP_SECRET}`
          )}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: params.toString(),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`토큰 갱신 실패: ${error}`);
      }

      const data = await response.json();

      // 새 액세스 토큰 저장 (리프레시 토큰은 그대로 유지)
      this.saveTokens({
        accessToken: data.access_token,
        refreshToken: this.tokens.refreshToken,
        expiresAt: Date.now() + data.expires_in * 1000, // 초를 밀리초로 변환
      });

      console.log("액세스 토큰 갱신 완료");
    } catch (error) {
      console.error("토큰 갱신 실패:", error);
      throw error;
    }
  }

  // ✅ 유효한 액세스 토큰 확보
  private async ensureValidAccessToken(): Promise<string> {
    if (this.isTokenExpired()) {
      console.log("토큰이 만료되었습니다. 갱신합니다...");
      await this.refreshAccessToken();
    }

    if (!this.tokens?.accessToken) {
      throw new Error("액세스 토큰을 가져올 수 없습니다");
    }

    return this.tokens.accessToken;
  }

  // OAuth 인증 시작 (리프레시 토큰 받기 위해 offline 모드 추가)
  public startAuth() {
    const authUrl = `https://www.dropbox.com/oauth2/authorize?client_id=${DROPBOX_APP_KEY}&response_type=code&token_access_type=offline&redirect_uri=${encodeURIComponent(
      DROPBOX_REDIRECT_URI
    )}`;
    window.location.href = authUrl;
  }

  // ✅ 인증 코드로 토큰 교환 (리프레시 토큰 포함)
  public async exchangeCodeForToken(code: string): Promise<void> {
    const params = new URLSearchParams({
      code,
      grant_type: "authorization_code",
      redirect_uri: DROPBOX_REDIRECT_URI,
    });

    try {
      const response = await fetch("https://api.dropboxapi.com/oauth2/token", {
        method: "POST",
        headers: {
          Authorization: `Basic ${btoa(
            `${DROPBOX_APP_KEY}:${DROPBOX_APP_SECRET}`
          )}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: params.toString(),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`토큰 교환 실패: ${error}`);
      }

      const data = await response.json();

      this.saveTokens({
        accessToken: data.access_token,
        refreshToken: data.refresh_token,
        expiresAt: Date.now() + data.expires_in * 1000,
      });

      console.log("토큰 교환 완료, 리프레시 토큰 저장됨");
    } catch (error) {
      console.error("토큰 교환 실패:", error);
      throw error;
    }
  }

  // 토큰 저장
  private saveTokens(tokens: DropboxTokens) {
    this.tokens = tokens;
    localStorage.setItem("dropbox-tokens", JSON.stringify(tokens));
  }

  // 인증 여부 확인
  public isAuthenticated(): boolean {
    return !!this.tokens?.refreshToken || !!this.tokens?.accessToken;
  }

  private encodeHeaderSafeJson(obj: unknown): string {
    const jsonString = JSON.stringify(obj);
    return jsonString.replace(/[\u007F-\uFFFF]/g, (char) => {
      return "\\u" + ("0000" + char.charCodeAt(0).toString(16)).slice(-4);
    });
  }

  // 파일 업로드
  public async uploadFile(
    file: File,
    itemId: string,
    onProgress?: (progress: number) => void
  ): Promise<ItemImage> {
    const accessToken = await this.ensureValidAccessToken();

    const fileName = `${Date.now()}_${file.name}`;
    const path = `/${itemId}/${fileName}`;

    try {
      const apiArg = this.encodeHeaderSafeJson({
        path,
        mode: "add",
        autorename: true,
        mute: false,
      });

      const response = await fetch(
        "https://content.dropboxapi.com/2/files/upload",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Dropbox-API-Arg": apiArg,
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
    const accessToken = await this.ensureValidAccessToken();

    try {
      const response = await fetch(
        "https://api.dropboxapi.com/2/sharing/create_shared_link_with_settings",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          body: this.encodeHeaderSafeJson({
            path,
            settings: {
              requested_visibility: "public",
            },
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();

        if (errorData.error?.[".tag"] === "shared_link_already_exists") {
          const existingLink =
            errorData.error?.shared_link_already_exists?.metadata?.url;
          if (existingLink) {
            return this.convertToDirectUrl(existingLink);
          }

          const existingLinks = await this.listSharedLinks(path);
          if (existingLinks.length > 0) {
            return this.convertToDirectUrl(existingLinks[0].url);
          }
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
        body: this.encodeHeaderSafeJson({ path }),
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
    const accessToken = await this.ensureValidAccessToken();

    try {
      const response = await fetch(
        "https://api.dropboxapi.com/2/files/delete_v2",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          body: this.encodeHeaderSafeJson({ path: dropboxPath }),
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

"use client";

import { useMutation, useQuery } from "convex/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { api } from "@/convex/_generated/api";
import type {
  DrivePickerDocument,
  DrivePickerResponse,
  TokenClient,
  TokenResponse,
} from "@/lib/types/drive";

// Google API configuration
const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ?? "";
const DRIVE_SCOPE = "https://www.googleapis.com/auth/drive.file";
const PICKER_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_PICKER_API_KEY ?? "";

// Script loading state
let gsiScriptLoaded = false;
let pickerScriptLoaded = false;

type UseDriveConnectionReturn = {
  // Connection state
  isConnected: boolean;
  isLoading: boolean;
  driveEmail: string | undefined;

  // Token state (ephemeral, not stored)
  accessToken: string | null;
  tokenExpiresAt: number | null;
  hasValidToken: boolean;
  getLatestAccessToken: () => string | null;

  // Actions
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  requestToken: () => Promise<string | null>;

  // Picker
  openPicker: () => Promise<DrivePickerDocument[] | null>;
  isPickerReady: boolean;

  // Error state
  error: string | null;
  clearError: () => void;
};

/**
 * Hook for managing Google Drive connection and file picking
 * Uses the token model (no refresh tokens stored)
 */
export function useDriveConnection(): UseDriveConnectionReturn {
  // Convex state
  const driveConnection = useQuery(api.user_documents.getDriveConnection);
  const connectDriveMutation = useMutation(api.user_documents.connectDrive);
  const disconnectDriveMutation = useMutation(
    api.user_documents.disconnectDrive
  );

  // Local state
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [tokenExpiresAt, setTokenExpiresAt] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isGsiReady, setIsGsiReady] = useState(false);
  const [isPickerReady, setIsPickerReady] = useState(false);

  // Refs for Google APIs
  const tokenClientRef = useRef<TokenClient | null>(null);
  const pendingTokenResolveRef = useRef<
    ((token: string | null) => void) | null
  >(null);
  const accessTokenRef = useRef<string | null>(null);
  const tokenExpiresAtRef = useRef<number | null>(null);

  // Initialize the token client (defined before useEffects that use it)
  const initializeTokenClient = useCallback(() => {
    console.debug("[DriveHook] initializeTokenClient called", {
      hasClientId: !!GOOGLE_CLIENT_ID,
    });
    if (!GOOGLE_CLIENT_ID) {
      setError("Google Client ID not configured");
      return;
    }

    if (!window.google?.accounts?.oauth2) {
      // Script loaded but API not ready yet, retry
      setTimeout(initializeTokenClient, 100);
      return;
    }

    tokenClientRef.current = window.google.accounts.oauth2.initTokenClient({
      client_id: GOOGLE_CLIENT_ID,
      scope: DRIVE_SCOPE,
      callback: (response: TokenResponse) => {
        if (response.error) {
          console.error(
            "Token response error:",
            response.error,
            response.error_description
          );
          setError(response.error_description ?? response.error);
          setAccessToken(null);
          setTokenExpiresAt(null);
          accessTokenRef.current = null;
          tokenExpiresAtRef.current = null;
          pendingTokenResolveRef.current?.(null);
          pendingTokenResolveRef.current = null;
          return;
        }

        const expiresAt = Date.now() + response.expires_in * 1000;
        // obtained access token (masked)
        setAccessToken(response.access_token);
        setTokenExpiresAt(expiresAt);
        accessTokenRef.current = response.access_token;
        tokenExpiresAtRef.current = expiresAt;
        setError(null);
        pendingTokenResolveRef.current?.(response.access_token);
        pendingTokenResolveRef.current = null;
      },
    });

    setIsGsiReady(true);
  }, []);

  // Load Google Identity Services script
  useEffect(() => {
    if (gsiScriptLoaded || typeof window === "undefined") {
      return;
    }

    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = () => {
      gsiScriptLoaded = true;
      initializeTokenClient();
    };
    script.onerror = () => {
      console.error(
        "[DriveHook] Failed to load Google Identity Services script"
      );
      setError("Failed to load Google Identity Services");
    };
    document.head.appendChild(script);

    return () => {
      // Don't remove script on unmount since it's shared
    };
  }, [initializeTokenClient]);

  // Load Google Picker script
  useEffect(() => {
    if (pickerScriptLoaded || typeof window === "undefined") {
      return;
    }

    const script = document.createElement("script");
    script.src = "https://apis.google.com/js/api.js";
    script.async = true;
    script.defer = true;
    script.onload = () => {
      // Load the picker module
      window.gapi?.load("picker", () => {
        pickerScriptLoaded = true;
        setIsPickerReady(true);
      });
    };
    script.onerror = () => {
      console.error("[DriveHook] Failed to load Google Picker script");
      setError("Failed to load Google Picker API");
    };
    document.head.appendChild(script);

    return () => {
      // Don't remove script on unmount since it's shared
    };
  }, []);

  // Check if token client is ready after GSI loads
  useEffect(() => {
    if (gsiScriptLoaded && !isGsiReady) {
      initializeTokenClient();
    }
  }, [isGsiReady, initializeTokenClient]);

  // Check if token is valid
  const hasValidToken =
    accessToken !== null &&
    tokenExpiresAt !== null &&
    tokenExpiresAt > Date.now() + 60_000; // 1 minute buffer

  // Request a new token (shows consent popup if needed)
  const requestToken = useCallback((): Promise<string | null> => {
    const hasValidTokenNow =
      accessTokenRef.current !== null &&
      tokenExpiresAtRef.current !== null &&
      tokenExpiresAtRef.current > Date.now() + 60_000;

    if (!tokenClientRef.current) {
      setError("Google Identity Services not ready");
      return Promise.resolve(null);
    }

    // If we have a valid token, return it
    if (hasValidTokenNow && accessTokenRef.current) {
      // returning cached access token (masked)
      return Promise.resolve(accessTokenRef.current);
    }

    return new Promise((resolve) => {
      pendingTokenResolveRef.current = resolve;
      const promptMode = "";
      // requesting access token with prompt
      tokenClientRef.current?.requestAccessToken({
        prompt: promptMode,
      });
    });
  }, []);

  // Connect to Drive (request token + update Convex state)
  const connect = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const token = await requestToken();
      // connect: requestToken resolved
      if (!token) {
        console.error(
          "[DriveHook] connect: no token returned from requestToken"
        );
        throw new Error("Failed to obtain access token");
      }

      // connect: obtained token (masked)

      // Get user info to store email
      const userInfoResponse = await fetch(
        "https://www.googleapis.com/oauth2/v2/userinfo",
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      let driveEmail: string | undefined;
      if (userInfoResponse.ok) {
        const userInfo = await userInfoResponse.json();
        // fetched userinfo
        driveEmail = userInfo.email;
      } else {
        console.warn("userinfo fetch failed", {
          status: userInfoResponse.status,
        });
      }

      // Update Convex state
      await connectDriveMutation({
        driveEmail,
        grantedScopes: [DRIVE_SCOPE],
      });
      // connect: Convex mutation sent
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to connect Drive");
    } finally {
      setIsLoading(false);
    }
  }, [requestToken, connectDriveMutation]);

  // Disconnect from Drive
  const disconnect = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Revoke the token if we have one
      if (accessToken) {
        try {
          // revoking token (masked)
          await fetch(
            `https://oauth2.googleapis.com/revoke?token=${accessToken}`,
            { method: "POST" }
          );
        } catch {
          // Ignore revocation errors
        }
      }

      // Clear local state
      setAccessToken(null);
      setTokenExpiresAt(null);
      accessTokenRef.current = null;
      tokenExpiresAtRef.current = null;

      // Update Convex state
      await disconnectDriveMutation();
      // disconnect: Convex mutation sent
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to disconnect Drive"
      );
    } finally {
      setIsLoading(false);
    }
  }, [accessToken, disconnectDriveMutation]);

  // Open Google Drive Picker
  const openPicker = useCallback(async (): Promise<
    DrivePickerDocument[] | null
  > => {
    if (!(isPickerReady && PICKER_API_KEY)) {
      console.error("[DriveHook] openPicker: Picker not ready", {
        isPickerReady,
        PICKER_API_KEY: !!PICKER_API_KEY,
      });
      setError("Google Picker not ready");
      return null;
    }

    // Ensure we have a valid token
    const token = await requestToken();
    // openPicker: requestToken returned
    if (!token) {
      return null;
    }

    return new Promise((resolve) => {
      let hasSettled = false;
      const settle = (value: DrivePickerDocument[] | null) => {
        if (hasSettled) {
          return;
        }
        hasSettled = true;
        resolve(value);
      };

      // Safety net: prevent an un-resolved promise if the picker fails silently.
      const timeoutId = window.setTimeout(() => {
        console.warn(
          "[DriveHook] openPicker: timed out waiting for picker action"
        );
        settle(null);
      }, 60_000);

      const google = window.google;
      // openPicker: window.google present?
      if (!google?.picker) {
        console.warn("[DriveHook] openPicker: google.picker missing");
        window.clearTimeout(timeoutId);
        settle(null);
        return;
      }

      const view = new google.picker.DocsView(google.picker.ViewId.DOCS);
      view.setMimeTypes("application/pdf");
      view.setMode(google.picker.DocsViewMode.LIST);
      // openPicker: Picker view configured

      const picker = new google.picker.PickerBuilder()
        .addView(view)
        .setOrigin(window.location.origin)
        .setOAuthToken(token)
        .setDeveloperKey(PICKER_API_KEY)
        .setCallback((data: DrivePickerResponse) => {
          // Picker callback invoked

          // Picker fires non-terminal actions (e.g., "loaded"). Only settle on terminal outcomes.
          if (data.action === "picked" && data.docs) {
            window.clearTimeout(timeoutId);
            settle(data.docs);
            return;
          }

          if (data.action === "cancel") {
            window.clearTimeout(timeoutId);
            settle(null);
            return;
          }
        })
        .setTitle("Select a PDF to index")
        .build();

      picker.setVisible(true);
      // Picker built and visible
    });
  }, [isPickerReady, requestToken]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    isConnected: driveConnection?.isConnected ?? false,
    isLoading: isLoading || driveConnection === undefined,
    driveEmail: driveConnection?.driveEmail,
    accessToken,
    tokenExpiresAt,
    hasValidToken,
    getLatestAccessToken: () => accessTokenRef.current,
    connect,
    disconnect,
    requestToken,
    openPicker,
    isPickerReady: isPickerReady && isGsiReady,
    error,
    clearError,
  };
}

// Type declarations for Google APIs
type GooglePickerBuilder = {
  addView: (view: unknown) => GooglePickerBuilder;
  setOrigin: (origin: string) => GooglePickerBuilder;
  setOAuthToken: (token: string) => GooglePickerBuilder;
  setDeveloperKey: (key: string) => GooglePickerBuilder;
  setCallback: (
    callback: (data: DrivePickerResponse) => void
  ) => GooglePickerBuilder;
  setTitle: (title: string) => GooglePickerBuilder;
  build: () => { setVisible: (visible: boolean) => void };
};

// Add type declarations for Google APIs on window
declare global {
  // biome-ignore lint/style/useConsistentTypeDefinitions: interface is required for global augmentation
  interface Window {
    google?: {
      accounts: {
        oauth2: {
          initTokenClient: (config: {
            client_id: string;
            scope: string;
            callback: (response: TokenResponse) => void;
          }) => TokenClient;
        };
      };
      picker: {
        DocsView: new (
          viewId: string
        ) => {
          setMimeTypes: (mimeTypes: string) => void;
          setMode: (mode: string) => void;
        };
        ViewId: {
          DOCS: string;
        };
        DocsViewMode: {
          LIST: string;
        };
        PickerBuilder: new () => GooglePickerBuilder;
      };
    };
    gapi?: {
      load: (api: string, callback: () => void) => void;
    };
  }
}

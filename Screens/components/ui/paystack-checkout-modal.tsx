import { Ionicons } from "@expo/vector-icons";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { WebView } from "react-native-webview";

import { colors, fonts } from "../../styles/theme";

const PAYSTACK_CALLBACK_PREFIX = "communityconnect://wallet/top-up/callback";

export type PaystackVerificationResult = {
  verified: boolean;
  message?: string;
};

type PaystackCheckoutModalProps = {
  visible: boolean;
  url: string | null;
  title?: string;
  onClose: () => void;
  onVerify: () => Promise<PaystackVerificationResult>;
};

export default function PaystackCheckoutModal({
  visible,
  url,
  title = "Secure Paystack Checkout",
  onClose,
  onVerify,
}: PaystackCheckoutModalProps) {
  const webViewRef = useRef<WebView>(null);
  const verificationRunning = useRef(false);
  const [canGoBack, setCanGoBack] = useState(false);
  const [progress, setProgress] = useState(0);
  const [verifying, setVerifying] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!visible) return;
    verificationRunning.current = false;
    setCanGoBack(false);
    setProgress(0);
    setVerifying(false);
    setMessage(null);
  }, [url, visible]);

  const verify = async () => {
    if (verificationRunning.current) return;
    verificationRunning.current = true;
    setVerifying(true);
    setMessage(null);

    try {
      const result = await onVerify();
      if (result.verified) {
        onClose();
        return;
      }
      setMessage(
        result.message ??
          "The backend has not confirmed this payment yet. Wait a moment and try again.",
      );
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Unable to verify this payment right now.",
      );
    } finally {
      verificationRunning.current = false;
      setVerifying(false);
    }
  };

  const handleNavigationRequest = (requestUrl: string) => {
    if (
      requestUrl
        .toLowerCase()
        .startsWith(PAYSTACK_CALLBACK_PREFIX.toLowerCase())
    ) {
      void verify();
      return false;
    }

    return requestUrl === "about:blank" || requestUrl.startsWith("https://");
  };

  const validCheckoutUrl = Boolean(url && /^https:\/\//i.test(url));

  return (
    <Modal
      animationType="slide"
      onRequestClose={onClose}
      presentationStyle="fullScreen"
      visible={visible}
    >
      <SafeAreaView style={styles.safe}>
        <View style={styles.header}>
          <Pressable
            onPress={() => {
              if (canGoBack) webViewRef.current?.goBack();
              else onClose();
            }}
            style={styles.headerButton}
          >
            <Ionicons
              color={colors.ink}
              name={canGoBack ? "arrow-back" : "close"}
              size={23}
            />
          </Pressable>
          <View style={styles.headerCopy}>
            <Text numberOfLines={1} style={styles.title}>
              {title}
            </Text>
            <View style={styles.secureRow}>
              <Ionicons color="#078d45" name="lock-closed" size={11} />
              <Text style={styles.secureText}>Secure in-app payment</Text>
            </View>
          </View>
          <Pressable onPress={onClose} style={styles.headerButton}>
            <Ionicons color="#6b7b73" name="close" size={24} />
          </Pressable>
        </View>

        {progress > 0 && progress < 1 ? (
          <View style={styles.progressTrack}>
            <View
              style={[styles.progressBar, { width: `${progress * 100}%` }]}
            />
          </View>
        ) : null}

        {validCheckoutUrl && url ? (
          <WebView
            ref={webViewRef}
            allowsBackForwardNavigationGestures
            javaScriptEnabled
            onError={(event) => setMessage(event.nativeEvent.description)}
            onHttpError={(event) =>
              setMessage(
                `Paystack returned HTTP ${event.nativeEvent.statusCode}. Please reload or try again.`,
              )
            }
            onLoadProgress={(event) => setProgress(event.nativeEvent.progress)}
            onNavigationStateChange={(state) => setCanGoBack(state.canGoBack)}
            onShouldStartLoadWithRequest={(request) =>
              handleNavigationRequest(request.url)
            }
            originWhitelist={[
              "https://*",
              "about:*",
              "communityconnect://wallet/top-up/callback*",
            ]}
            setSupportMultipleWindows={false}
            sharedCookiesEnabled
            source={{ uri: url }}
            startInLoadingState
            thirdPartyCookiesEnabled
            renderLoading={() => (
              <View style={styles.loading}>
                <ActivityIndicator color="#08b657" size="large" />
                <Text style={styles.loadingText}>Opening Paystack...</Text>
              </View>
            )}
            style={styles.webView}
          />
        ) : (
          <View style={styles.loading}>
            <Ionicons color="#a64040" name="warning-outline" size={40} />
            <Text style={styles.errorTitle}>Invalid checkout link</Text>
            <Text style={styles.loadingText}>
              The backend did not return a secure HTTPS Paystack URL.
            </Text>
          </View>
        )}

        <View style={styles.footer}>
          {message ? <Text style={styles.message}>{message}</Text> : null}
          <Pressable
            disabled={verifying || !validCheckoutUrl}
            onPress={() => void verify()}
            style={[
              styles.verifyButton,
              (verifying || !validCheckoutUrl) && styles.disabled,
            ]}
          >
            {verifying ? (
              <ActivityIndicator color={colors.ink} />
            ) : (
              <Ionicons
                color={colors.ink}
                name="shield-checkmark-outline"
                size={21}
              />
            )}
            <Text style={styles.verifyText}>
              {verifying
                ? "Verifying with backend..."
                : "I have completed payment"}
            </Text>
          </Pressable>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  safe: { backgroundColor: colors.white, flex: 1 },
  header: {
    alignItems: "center",
    backgroundColor: colors.white,
    borderBottomColor: "#e8eeeb",
    borderBottomWidth: 1,
    flexDirection: "row",
    minHeight: 72,
    paddingHorizontal: 10,
  },
  headerButton: {
    alignItems: "center",
    height: 48,
    justifyContent: "center",
    width: 48,
  },
  headerCopy: { alignItems: "center", flex: 1 },
  title: {
    color: colors.ink,
    fontFamily: fonts.extraBold,
    fontSize: 15,
    maxWidth: "100%",
  },
  secureRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 4,
    marginTop: 3,
  },
  secureText: { color: "#078d45", fontFamily: fonts.medium, fontSize: 9 },
  progressTrack: { backgroundColor: "#e6eee9", height: 3 },
  progressBar: { backgroundColor: colors.lime, height: 3 },
  webView: { backgroundColor: colors.white, flex: 1 },
  loading: {
    alignItems: "center",
    backgroundColor: colors.white,
    flex: 1,
    justifyContent: "center",
    padding: 30,
  },
  loadingText: {
    color: "#66766e",
    fontFamily: fonts.medium,
    fontSize: 12,
    lineHeight: 19,
    marginTop: 12,
    textAlign: "center",
  },
  errorTitle: {
    color: colors.ink,
    fontFamily: fonts.extraBold,
    fontSize: 18,
    marginTop: 12,
  },
  footer: {
    backgroundColor: colors.white,
    borderTopColor: "#e8eeeb",
    borderTopWidth: 1,
    padding: 14,
  },
  message: {
    color: "#9f3f3f",
    fontFamily: fonts.medium,
    fontSize: 11,
    lineHeight: 17,
    marginBottom: 9,
    textAlign: "center",
  },
  verifyButton: {
    alignItems: "center",
    backgroundColor: colors.lime,
    borderRadius: 24,
    flexDirection: "row",
    gap: 9,
    justifyContent: "center",
    minHeight: 56,
  },
  verifyText: { color: colors.ink, fontFamily: fonts.bold, fontSize: 13 },
  disabled: { opacity: 0.55 },
});

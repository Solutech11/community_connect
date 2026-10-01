import AsyncStorage from "@react-native-async-storage/async-storage";

import { configureSessionCacheStorage } from "../cache/session-cache";

// Tokens remain in SecureStore; this adapter stores only screen snapshots.
configureSessionCacheStorage(AsyncStorage);

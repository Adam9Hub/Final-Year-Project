import { Platform } from 'react-native';
import Constants from 'expo-constants';

const getBackendUrl = () => {
    // Dynamically grab the IP address of the machine running the Expo Metro Bundler
    const debuggerHost = Constants.expoConfig?.hostUri;
    
    if (debuggerHost) {
        // debuggerHost is usually formatted as "192.168.1.5:8081". 
        // We split it to get just the IP, and attach your backend port (3000).
        const localIp = debuggerHost.split(':')[0];
        return `http://${localIp}:3000`;
    }
    
    // Fallback just in case
    return `http://172.17.82.152:3000`;
};

export const API_BASE_URL = getBackendUrl();

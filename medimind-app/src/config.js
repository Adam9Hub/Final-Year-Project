import { Platform } from 'react-native';
import Constants from 'expo-constants';

const getBackendUrl = () => {
    // Hardcoded to your Mac's current local Wi-Fi IP address so the phones can always find the server
    const localIp = '172.17.82.61';
    return `http://${localIp}:3000`;
};

export const API_BASE_URL = getBackendUrl();

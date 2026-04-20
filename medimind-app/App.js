import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppProvider } from './src/context/AppContext';
import AppNavigator from './src/navigation/AppNavigator';
import ToastContainer from './src/components/Toast';
import { useApp } from './src/context/AppContext';
import { setupNotificationHandler } from './src/services/notificationService';

// Configure notification handling at app startup
setupNotificationHandler();

function AppContent() {
  const { toasts } = useApp();
  return (
    <>
      <StatusBar style="dark" />
      <ToastContainer toasts={toasts} />
      <AppNavigator />
    </>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <AppProvider>
        <AppContent />
      </AppProvider>
    </SafeAreaProvider>
  );
}

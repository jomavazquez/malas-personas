import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { useEffect } from "react";
import "./i18n";
import { AuthProvider, useAuth, JoinModalProvider, ToastProvider } from "./context";
import { useLenis } from "./hooks";
import { scrollToTop } from "./lib";
import { HomePage, GamePage, LobbyPage, LoginPage, RegisterPage, ForgotPasswordPage, MyRoomsPage, RoomPage, LegalPage, ContactPage, HelpCenterPage, MyDecksPage, MyCardsPage } from "./pages";

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  
  const { user, loading } = useAuth();
  if( loading ) return null;
  if( !user ) return <Navigate to="/login" replace />;
  
  return <>{ children }</>;
};

const ScrollToTop = () => {
  const { pathname } = useLocation();
  useEffect(() => { scrollToTop(); }, [pathname]);
  return null;
};

const AppInner = () => {
  useLenis();
  return (
    <>
      <ScrollToTop />
      <Routes>
        <Route path="/" element={ <HomePage /> } />
        <Route path="/login" element={ <LoginPage /> } />
        <Route path="/register" element={ <RegisterPage /> } />
        <Route path="/forgot-password" element={ <ForgotPasswordPage /> } />
        <Route path="/help-center" element={ <HelpCenterPage /> } />
        <Route path="/contact" element={ <ContactPage /> } />
        <Route path="/lobby" element={ <ProtectedRoute><LobbyPage /></ProtectedRoute> } />
        <Route path="/room/:code" element={ <RoomPage /> } />
        <Route path="/my-rooms" element={ <ProtectedRoute><MyRoomsPage /></ProtectedRoute> } />
        <Route path="/my-decks" element={ <ProtectedRoute><MyDecksPage /></ProtectedRoute> } />
        <Route path="/my-cards" element={ <ProtectedRoute><MyCardsPage /></ProtectedRoute> } />
        <Route path="/game/:code" element={ <GamePage /> } />
        <Route path="/legal-notice" element={ <LegalPage doc="legal-notice" /> } />
        <Route path="/privacy-policy" element={ <LegalPage doc="privacy-policy" /> } />
        <Route path="/cookies-policy" element={ <LegalPage doc="cookies-policy" /> } />
        <Route path="*" element={ <Navigate to="/" replace /> } />
      </Routes>    
    </>
  );
};

const App = () => (
  <BrowserRouter>
    <AuthProvider>
      <ToastProvider>
        <JoinModalProvider>
          <AppInner />
        </JoinModalProvider>
      </ToastProvider>
    </AuthProvider>
  </BrowserRouter>
);

export default App;
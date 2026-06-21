import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { useLenis } from "./hooks/useLenis";
import { HomePage, GamePage, LobbyPage, LoginPage, RegisterPage, RoomPage, LegalPage } from "./pages";
import "./i18n";
import { scrollToTop } from "./lib";

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
        <Route path="/lobby" element={ <ProtectedRoute><LobbyPage /></ProtectedRoute> } />
        <Route path="/room/:code" element={ <RoomPage /> } />
        <Route path="/game/:code" element={ <ProtectedRoute><GamePage /></ProtectedRoute> } />
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
      <AppInner />
    </AuthProvider>
  </BrowserRouter>
);

export default App;
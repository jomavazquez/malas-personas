import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { useEffect, lazy, Suspense } from "react";
import "./i18n";
import { AuthProvider, useAuth, JoinModalProvider, ToastProvider } from "./context";
import { useLenis } from "./hooks";
import { scrollToTop } from "./lib";

const HomePage = lazy(() => import("./pages/HomePage").then((m) => ({ default: m.HomePage })));
const GameRouterPage = lazy(() => import("./pages/GameRouterPage").then((m) => ({ default: m.GameRouterPage })));
const LobbyPage = lazy(() => import("./pages/LobbyPage").then((m) => ({ default: m.LobbyPage })));
const LoginPage = lazy(() => import("./pages/LoginPage").then((m) => ({ default: m.LoginPage })));
const RegisterPage = lazy(() => import("./pages/RegisterPage").then((m) => ({ default: m.RegisterPage })));
const ForgotPasswordPage = lazy(() => import("./pages/ForgotPasswordPage").then((m) => ({ default: m.ForgotPasswordPage })));
const MyRoomsPage = lazy(() => import("./pages/MyRoomsPage").then((m) => ({ default: m.MyRoomsPage })));
const RoomPage = lazy(() => import("./pages/RoomPage").then((m) => ({ default: m.RoomPage })));
const LegalPage = lazy(() => import("./pages/LegalPage").then((m) => ({ default: m.LegalPage })));
const ContactPage = lazy(() => import("./pages/ContactPage").then((m) => ({ default: m.ContactPage })));
const HelpCenterPage = lazy(() => import("./pages/HelpCenterPage").then((m) => ({ default: m.HelpCenterPage })));
const TeamIdeasPage = lazy(() => import("./pages/TeamIdeasPage").then((m) => ({ default: m.TeamIdeasPage })));
const MyDecksPage = lazy(() => import("./pages/MyDecksPage").then((m) => ({ default: m.MyDecksPage })));
const MyCardsPage = lazy(() => import("./pages/MyCardsPage").then((m) => ({ default: m.MyCardsPage })));
const NotFoundPage = lazy(() => import("./pages/NotFoundPage").then((m) => ({ default: m.NotFoundPage })));

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

// index.html is shared by every route, so the canonical URL can't live there: a fixed one
// would tell search engines that every page is a duplicate of the home page.
const CanonicalLink = () => {
  const { pathname } = useLocation();
  return <link rel="canonical" href={ `https://www.malaspersonas.com${pathname}` } />;
};

// Removes the prerendered copy of the page (see scripts/prerender.mjs) once React has painted
// the real one. It sits inside the same Suspense boundary as the routes, so its effect only runs
// after the lazy page and its translations have loaded.
const PrerenderSwap = () => {
  useEffect(() => {
    document.querySelectorAll("#prerender, [data-prerender]").forEach(( el ) => el.remove());
  }, []);
  return null;
};

const AppInner = () => {
  useLenis();
  return (
    <>
      <ScrollToTop />
      <CanonicalLink />
      <Suspense fallback={ null }>
        <Routes>
          <Route path="/" element={ <HomePage /> } />
          <Route path="/login" element={ <LoginPage /> } />
          <Route path="/register" element={ <RegisterPage /> } />
          <Route path="/forgot-password" element={ <ForgotPasswordPage /> } />
          <Route path="/help-center" element={ <HelpCenterPage /> } />
          <Route path="/team-ideas" element={ <TeamIdeasPage /> } />
          <Route path="/contact" element={ <ContactPage /> } />
          <Route path="/lobby" element={ <ProtectedRoute><LobbyPage /></ProtectedRoute> } />
          <Route path="/room/:code" element={ <RoomPage /> } />
          <Route path="/my-rooms" element={ <ProtectedRoute><MyRoomsPage /></ProtectedRoute> } />
          <Route path="/my-decks" element={ <ProtectedRoute><MyDecksPage /></ProtectedRoute> } />
          <Route path="/my-cards" element={ <ProtectedRoute><MyCardsPage /></ProtectedRoute> } />
          <Route path="/game/:code" element={ <GameRouterPage /> } />
          <Route path="/legal-notice" element={ <LegalPage doc="legal-notice" /> } />
          <Route path="/privacy-policy" element={ <LegalPage doc="privacy-policy" /> } />
          <Route path="/cookies-policy" element={ <LegalPage doc="cookies-policy" /> } />
          <Route path="*" element={ <NotFoundPage /> } />
        </Routes>
        <PrerenderSwap />
      </Suspense>
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
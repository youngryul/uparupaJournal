import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import NotFound from "@/pages/not-found";
import DiaryPage from "@/pages/diary";
import LoginPage from "@/pages/login";
import SignupPage from "@/pages/signup";
import { useEffect } from "react";

// Redirect component for authenticated users
function AuthRedirect() {
  const [, setLocation] = useLocation();
  
  useEffect(() => {
    setLocation("/");
  }, [setLocation]);
  
  return null;
}

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-sky-soft to-cloud-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-sky-light rounded-full flex items-center justify-center text-3xl mx-auto mb-4 animate-float">
            🌸
          </div>
          <p className="text-sky-600">로딩 중...</p>
        </div>
      </div>
    );
  }

  return (
    <Switch>
      {!isAuthenticated ? (
        <>
          <Route path="/login" component={LoginPage} />
          <Route path="/signup" component={SignupPage} />
          <Route path="/" component={LoginPage} />
        </>
      ) : (
        <>
          <Route path="/" component={DiaryPage} />
          <Route path="/diary" component={DiaryPage} />
          <Route path="/login" component={AuthRedirect} />
          <Route path="/signup" component={AuthRedirect} />
        </>
      )}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;

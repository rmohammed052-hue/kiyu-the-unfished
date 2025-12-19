import { useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import AuthForm from "@/components/AuthForm";
import ThemeToggle from "@/components/ThemeToggle";
import logoLight from "@assets/light_mode_1762169855262.png";
import logoDark from "@assets/photo_2025-09-24_21-19-48-removebg-preview_1762169855290.png";

export default function AuthPage() {
  const [, navigate] = useLocation();
  const { login, signup, isAuthenticated, user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (isAuthenticated && user) {
      // Redirect based on user role
      if (user.role === 'super_admin' || user.role === 'admin') {
        navigate("/admin");
      } else if (user.role === 'seller') {
        navigate("/seller");
      } else if (user.role === 'rider') {
        navigate("/rider");
      } else if (user.role === 'buyer') {
        navigate("/buyer");
      } else if (user.role === 'agent') {
        navigate("/agent");
      } else {
        navigate("/");
      }
    }
  }, [isAuthenticated, user, navigate]);

  const handleLogin = async (email: string, password: string) => {
    try {
      await login(email, password);
      toast({
        title: "Login Successful",
        description: "Welcome back!",
      });
    } catch (error: any) {
      toast({
        title: "Login Failed",
        description: error.message || "Invalid email or password",
        variant: "destructive",
      });
    }
  };

  const handleSignup = async (name: string, email: string, password: string) => {
    try {
      await signup({ name, email, password, role: "buyer" });
      toast({
        title: "Account Created",
        description: "Welcome to KiyuMart!",
      });
    } catch (error: any) {
      toast({
        title: "Signup Failed",
        description: error.message || "Failed to create account",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <div className="sticky top-0 z-50 w-full border-b bg-background">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div 
              className="cursor-pointer" 
              data-testid="logo-container"
              onClick={() => navigate("/")}
            >
              <img 
                src={logoLight}
                alt="KiyuMart"
                className="h-10 w-auto dark:hidden"
                data-testid="logo-light"
              />
              <img 
                src={logoDark}
                alt="KiyuMart"
                className="h-10 w-auto hidden dark:block"
                data-testid="logo-dark"
              />
            </div>
            <ThemeToggle />
          </div>
        </div>
      </div>
      
      <div className="flex-1 flex items-center justify-center p-6 bg-muted/30">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-primary mb-2">Welcome to KiyuMart</h1>
            <p className="text-muted-foreground">Quality meet affordability</p>
          </div>
          
          <AuthForm
            onLogin={handleLogin}
            onSignup={handleSignup}
          />
        </div>
      </div>
    </div>
  );
}

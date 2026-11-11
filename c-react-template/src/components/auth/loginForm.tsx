import { useAuth } from "@/lib/context/useAuth";
import { Label } from "@radix-ui/react-label";
import { Eye, EyeClosed, Loader2, Building2 } from "lucide-react";
import { useState } from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
// import { ForgotPasswordModal } from "./forgotPasswordModal";




interface LoginFormProps {
  onSignUpClick: () => void;
}

export const LoginForm: React.FC<LoginFormProps> = ({ onSignUpClick }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [see, setSee] = useState(false);
  // const [showForgotPassword, setShowForgotPassword] = useState(false);
  
  const { login, isLoading } = useAuth();

  // const forgotPassword = async () => {
  //   try{
  //     await post()
  //   }catch(err){

  //   }
  // }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      return;
    }

    try {
      await login(email, password);
      // Navigation is handled by the auth context's login method
    } catch (err) {
      // Error is already displayed by useAuth hook via toast
      console.error('Login failed:', err);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="bg-white rounded-2xl shadow-xl p-6 space-y-4 border border-gray-100">
        <div className="space-y-1">
          {/* <Logo className="h-20 w-auto mx-auto transform hover:scale-105 transition-transform duration-300 "/> */}
        <img
          src="/logos/chizotech logo black_.png"
          alt="ChizoTech Logo"
className="h-14 w-auto mx-auto transform hover:scale-105 transition-transform duration-300 "
        ></img>
        
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="email" className="text-xs sm:text-sm font-medium text-gray-700">
              Email Address
            </Label>
            <Input
              placeholder="admin@example.com"
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full h-10 transition-all duration-200 focus:ring-2 focus:ring-blue focus:border-transparent text-sm"
              disabled={isLoading}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="password" className="text-xs sm:text-sm font-medium text-gray-700">
              Password
            </Label>
            <div className="relative">
              <Input
                placeholder="Enter your password"
                id="password"
                type={see ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full h-10 pr-10 transition-all duration-200 focus:ring-2 focus:ring-blue focus:border-transparent text-sm"
                disabled={isLoading}
              />
              <Button
                className="absolute right-0 top-0 h-10 px-3 hover:bg-transparent"
                variant="ghost"
                type="button"
                onClick={() => setSee(!see)}

                tabIndex={-1}
              >
                {see ? (
                  <Eye className="h-4 w-4 text-gray-500" />
                ) : (
                  <EyeClosed className="h-4 w-4 text-gray-500" />
                )}
              </Button>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="button"
              // onClick={() => setShowForgotPassword(true)}
              className="text-xs sm:text-sm text-blue hover:text-blue-dark font-medium transition-colors duration-200 hover:underline"
            >
              Forgot password?
            </button>
          </div>

          <Button
            type="submit"
            className="w-full h-10 bg-gradient-to-r from-blue to-blue-dark hover:from-blue-dark hover:to-blue-dark text-white font-medium shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02] text-sm"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Signing in...
              </>
            ) : (
              "Sign In"
            )}
          </Button>
        </form>

        {/* Divider */}
        <div className="relative py-2">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-gray-200" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-white px-2 text-gray-500">Don't have an account?</span>
          </div>
        </div>

        {/* Sign Up Section */}
        <div className="space-y-2">
          <Button
            type="button"
            variant="outline"
            onClick={onSignUpClick}
            className="w-full h-10 border-2 border-[#E5600B] text-[#E5600B] hover:bg-[#E5600B] hover:text-white font-medium transition-all duration-300 transform hover:scale-[1.02] shadow-sm hover:shadow-md text-sm"
          >
            <Building2 className="mr-2 h-4 w-4" />
            Register Your Business
          </Button>
          <p className="text-xs text-center text-gray-500 leading-relaxed">
            Complete your registration and get started
          </p>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {/* <ForgotPasswordModal
        open={showForgotPassword}
        onOpenChange={setShowForgotPassword}
      /> */}
    </div>
  );

};
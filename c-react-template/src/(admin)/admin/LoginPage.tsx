import React from "react";

import { LoginForm } from "../../components/auth/loginForm";
import { Building2, ShieldCheck, FileCheck } from "lucide-react";
// import { post } from "@/lib/api/crud";

interface LoginPageProps {
  onSignUpClick: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onSignUpClick }) => {
  return (
    <main className="h-screen flex flex-col lg:flex-row bg-gradient-to-br from-gray-50 to-gray-100 overflow-hidden">
      {/* Left side - Form content */}
      <div className="w-full lg:w-1/2 px-4 py-8 sm:px-6 sm:py-10 md:px-8 lg:px-12 flex flex-col justify-center h-screen overflow-y-auto">
        {/* Logo and Brand */}

          {/* <img
            src="U-KYC-logo-stacked.png"
            alt="Chizo's React Template"
            className="w-auto h-20 sm:h-24 md:h-28 mx-auto transform hover:scale-105 transition-transform duration-300"
          /> */}
          {/* <div className="></div> */}

         


        <div className="w-full max-w-md mx-auto lg:max-w-none py-4">
          <LoginForm onSignUpClick={onSignUpClick} />
        </div>
      </div>

      {/* Right side - Brand showcase */}
       <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden m-3 lg:m-4 rounded-3xl shadow-2xl">
        {/* Gradient background - Blue theme */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#2563EB] via-[#1D4ED8] to-[#1E40AF]"></div>
        
        {/* Animated pattern overlay */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: `radial-gradient(circle at 2px 2px, white 1px, transparent 0)`,
            backgroundSize: '40px 40px'
          }}></div>
        </div>

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-between p-6 lg:p-8 xl:p-10 text-white w-full h-full">
          <div className="space-y-4">
            <h2 className="text-2xl lg:text-3xl xl:text-4xl font-bold leading-tight">
              React Admin Template
            </h2>
            <p className="text-base lg:text-lg opacity-90 leading-relaxed max-w-lg">
              A modern, production-ready web application template featuring a professional dashboard, authentication system, and responsive design built with React, TypeScript, Tailwind CSS, and Vite.
            </p>
          </div>

          {/* Feature highlights */}
          <div className="grid gap-3 mt-auto">
            <div className="flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-xl p-3 hover:bg-white/20 transition-all duration-300">
              <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center">
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold text-base">Ready-to-Use Template</h3>
                <p className="text-xs opacity-80">Pre-built admin dashboard with authentication</p>
              </div>
            </div>
            <div className="flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-xl p-3 hover:bg-white/20 transition-all duration-300">
              <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold text-base">Modern Tech Stack</h3>
                <p className="text-xs opacity-80">React, TypeScript, Tailwind CSS, Vite</p>
              </div>
            </div>
            <div className="flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-xl p-3 hover:bg-white/20 transition-all duration-300">
              <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center">
                <FileCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold text-base">Production Ready</h3>
                <p className="text-xs opacity-80">Scalable architecture and best practices</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
};



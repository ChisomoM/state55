import React from "react";

import { LoginForm } from "../../components/auth/loginForm";
import { AuthShell } from "../../components/auth/AuthShell";

interface LoginPageProps {
  onSignUpClick: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onSignUpClick }) => {
  return (
    <AuthShell>
      <LoginForm onSignUpClick={onSignUpClick} />
    </AuthShell>
  );
};

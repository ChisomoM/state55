import { useNavigate } from 'react-router-dom';
import { LoginPage } from '../(admin)/admin/LoginPage';

export default function Login() {
  const navigate = useNavigate();

  return <LoginPage onSignUpClick={() => navigate('/register')} />;
}

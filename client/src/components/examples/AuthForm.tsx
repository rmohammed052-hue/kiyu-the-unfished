import AuthForm from '../AuthForm';

export default function AuthFormExample() {
  return (
    <div className="p-8 flex items-center justify-center min-h-screen bg-muted">
      <AuthForm
        onLogin={(email, password) => console.log('Login:', email, password)}
        onSignup={(name, email, password) => console.log('Signup:', name, email, password)}
      />
    </div>
  );
}

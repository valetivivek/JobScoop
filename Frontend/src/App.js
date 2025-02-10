import logo from './logo.svg';
import './App.css';
import './App.css'
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import Login from './login/login';
import SignUp from './login/signup';
import router from './Routes/routes';
import { AuthProvider } from './contexts/AuthContext';


function App() {
  return (
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  );
}

export default App;

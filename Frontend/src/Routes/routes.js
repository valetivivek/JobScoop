import { createBrowserRouter } from 'react-router-dom';
import Login from '../login/login';
import SignUp from '../login/signup';
import Home from '../landing'; 
import ProtectedRoute from './protectedRoutes';
import PasswordReset from '../login/PasswordReset';
import { Navigate } from "react-router-dom";

const router = createBrowserRouter([
  {
    path: '/login',
    element: <Login />,
    errorElement: <div>ERROR 404: NOT FOUND</div>
  },
  {
    path: '/signup',
    element: <SignUp />,
    errorElement: <div>ERROR 404: NOT FOUND</div>
  },
  {
    path: '/home',
    element: <ProtectedRoute><Home /></ProtectedRoute>, // Protect the Home route
    errorElement: <div>ERROR 404: NOT FOUND</div>
  },
  {
    path: '/password-reset',
    element: <PasswordReset></PasswordReset>,
    errorElement: <div>ERROR 404: NOT FOUND</div>
  },
  {
    path: "/",
    element: <Navigate to="/home" />,
  },
]);

export default router;

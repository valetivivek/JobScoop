import { createBrowserRouter } from 'react-router-dom';
import Login from '../login/login';
import SignUp from '../login/signup';
import Home from '../landing';
import ProtectedRoute from './protectedRoutes';
import PasswordReset from '../login/PasswordReset';
import { Navigate } from "react-router-dom";
import Layout from '../Layout';
import Trends from '../Trends';
import AddSubscriptions from '../subscribe/Add_Subscriptions';
import Subscribe from '../subscribe/Subscribe';
const router = createBrowserRouter([
  {

    path: '/',
    element: <Layout />,
    children: [
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
        path: '/subscribe',
        element: <ProtectedRoute> <Subscribe></Subscribe></ProtectedRoute>,
        errorElement: <div>ERROR 404: NOT FOUND</div>
      },
      {
        path: '/subscribe/addsubscriptions',
        element: <ProtectedRoute> <AddSubscriptions></AddSubscriptions></ProtectedRoute>,
        errorElement: <div>ERROR 404: NOT FOUND</div>
      },
      {
        path: '/trends',
        element: <ProtectedRoute><Trends></Trends></ProtectedRoute>,
        errorElement: <div>ERROR 404: NOT FOUND</div>
      },
      {
        path: "/",
        element: <Navigate to="/home" />,
      },
    ]
  }]);

export default router;

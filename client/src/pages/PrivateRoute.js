import { Navigate } from "react-router-dom";

function PrivateRoute({ children }) {
    console.log("private route !!");
  const token = localStorage.getItem("token");
  return token ? children : <Navigate to="/adminLogin" />;
}

export default PrivateRoute;


import logo from './logo.svg';
import './App.css';
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Usershomepage from "./pages/usershomepage"
import Adminhomepage from './pages/adminhomepage';
import PrivateRoute from './pages/PrivateRoute'
import AdminLogin from './pages/adminLogin';
function App() {
  return (
    
    <Router>
      
      <Routes>
        <Route path = "/" element = {<Usershomepage/>} />
        <Route
          path="/admin"
          element={
            <PrivateRoute>
              <Adminhomepage />
            </PrivateRoute>
          }
        />
                <Route path="/adminLogin" element={<AdminLogin />} />
       
      </Routes>
      </Router>
    

  );
}

export default App;

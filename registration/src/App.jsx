import { Routes, Route, Navigate } from "react-router-dom";
import RegisterScreen from "./screens/RegisterScreen";

function App() {
  return (
    <Routes>
      <Route
        path="/register/:slug"
        element={<RegisterScreen />}
      />

      <Route
        path="*"
        element={<Navigate to="/register/barber-booking" replace />}
      />
    </Routes>
  );
}

export default App;
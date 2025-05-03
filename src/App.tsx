import { Route, Routes } from "react-router-dom";
import DashboardLayout from "@/layouts/dashboard";
import UploadPage from "@/pages/upload";
import WebcamPage from "@/pages/webcam";
import DetectionsPage from "@/pages/detections";

function App() {
  return (
    <Routes>
      <Route path="/" element={<DashboardLayout />}>
        <Route path="upload" element={<UploadPage />} />
        <Route path="webcam" element={<WebcamPage />} />
        <Route path="detections" element={<DetectionsPage />} />
      </Route>
    </Routes>
  );
}

export default App;

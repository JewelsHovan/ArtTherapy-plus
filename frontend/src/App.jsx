import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Welcome from './pages/Welcome';
import ModeSelection from './pages/ModeSelection';
import PainDescription from './pages/PainDescription';
import ComponentShowcase from './pages/ComponentShowcase';
import Settings from './pages/Settings';
import Profile from './pages/Profile';
import Registration from './pages/Registration';
import Visualize from './pages/Visualize';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Welcome />} />
        <Route path="/register" element={<Registration />} />
        <Route path="/mode" element={<ModeSelection />} />
        <Route path="/describe" element={<PainDescription />} />
        <Route path="/visualize" element={<Visualize />} />
        <Route path="/componentshowcase" element={<ComponentShowcase />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/profile" element={<Profile />} />
      </Routes>
    </Router>
  );
}

export default App;
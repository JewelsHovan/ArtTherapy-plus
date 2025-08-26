import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import AppLayout from './components/layout/AppLayout';
import Welcome from './pages/Welcome';
import ModeSelection from './pages/ModeSelection';
import PainDescription from './pages/PainDescription';
import ComponentShowcase from './pages/ComponentShowcase';
import Settings from './pages/Settings';
import Profile from './pages/Profile';
import Registration from './pages/Registration';
import Visualize from './pages/Visualize';
import About from './pages/About';
import Gallery from './pages/Gallery';

function App() {
  return (
    <Router>
      <Routes>
        {/* Routes without navigation header */}
        <Route path="/register" element={<Registration />} />
        
        {/* Routes with navigation header */}
        <Route element={<AppLayout />}>
          <Route path="/" element={<Welcome />} />
          <Route path="/about" element={<About />} />
          <Route path="/mode" element={<ModeSelection />} />
          <Route path="/describe" element={<PainDescription />} />
          <Route path="/visualize" element={<Visualize />} />
          <Route path="/gallery" element={<Gallery />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/componentshowcase" element={<ComponentShowcase />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
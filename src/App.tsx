import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
import Messages from './pages/Messages';
import MagicMoments from './pages/MagicMoments';
import Nominate from './pages/Nominate';
import Announcements from './pages/Announcements';
import Profile from './pages/Profile';

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/messages" element={<Messages />} />
          <Route path="/magic-moments" element={<MagicMoments />} />
          <Route path="/nominate" element={<Nominate />} />
          <Route path="/announcements" element={<Announcements />} />
          <Route path="/profile" element={<Profile />} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;

import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LandingPage from './components/LandingPage';
import TwitterPage from './components/TwitterPage';
import G2Page from './components/G2Page';
import RedditPage from './components/RedditPage';

const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/twitter" element={<TwitterPage />} />
        <Route path="/g2" element={<G2Page />} />
        <Route path="/reddit" element={<RedditPage />} />
      </Routes>
    </Router>
  );
};

export default App;

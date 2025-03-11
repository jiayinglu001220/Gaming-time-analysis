import React, { useEffect } from 'react';
import { HashRouter as Router, Routes, Route, Link, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { Navbar, Nav } from 'react-bootstrap';
import Graph1 from './components/Graph1';
import Graph2 from './components/Graph2';
import Graph3 from './components/Graph3';

function App() {
  return (
    <Router>
      <RedirectWrapper>
        <div style={{ 
          height: '100vh', 
          width: '100vw',
          margin: 0,
          padding: 0,
          overflow: 'hidden',
          display: 'flex', 
          flexDirection: 'column',
          backgroundColor: '#212529'
        }}>
          <Navbar bg="dark" variant="dark" expand="lg" style={{ padding: '0.5rem' }}>
            <Nav.Link as={Link} to="/" className="navbar-brand">Game Play Visualization</Nav.Link>
            <Navbar.Toggle aria-controls="basic-navbar-nav" />
            <Navbar.Collapse id="basic-navbar-nav">
              <Nav className="me-auto">
                <Nav.Link as={Link} to="/graph1">US Level</Nav.Link>
                <Nav.Link as={Link} to="/graph2">State Level</Nav.Link>
                <Nav.Link as={Link} to="/graph3">City Level</Nav.Link>
              </Nav>
            </Navbar.Collapse>
          </Navbar>
          <div style={{ 
            flex: 1,
            width: '100%',
            overflow: 'hidden',
            position: 'relative'
          }}>
            <Routes>
              <Route path="/" element={<Navigate to="/graph1" replace />} /> {/* Redirect "/" to "/graph1" */}
              <Route path="/graph1" element={<Graph1 />} />
              <Route path="/graph2" element={<Graph2 />} />
              <Route path="/graph3" element={<Graph3 />} />
            </Routes>
          </div>
        </div>
      </RedirectWrapper>
    </Router>
  );
}

// Component to handle redirection
function RedirectWrapper({ children }) {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Redirect if the current path is "/project-team-wonder4"
    if (location.pathname === '/project-team-wonder4') {
      navigate('/graph1', { replace: true });
    }
  }, [location, navigate]);

  return children;
}

export default App;

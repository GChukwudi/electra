import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Web3Provider } from './contexts/Web3Context';
import { ElectionProvider } from './contexts/ElectionContext';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Vote from './pages/Vote';
import Admin from './pages/Admin';
import Results from './pages/Results';
import './App.css';

function App() {
  return (
    <div className="App">
      <Web3Provider>
        <ElectionProvider>
          <Router>
            <div style={{ minHeight: '100vh', backgroundColor: '#f9fafb' }}>
              <Navbar />
              
              <main style={{ 
                maxWidth: '1200px', 
                margin: '0 auto', 
                padding: '2rem 1rem' 
              }}>
                <Routes>
                  <Route path="/" element={<Home />} />
                  <Route path="/vote" element={<Vote />} />
                  <Route path="/admin" element={<Admin />} />
                  <Route path="/results" element={<Results />} />
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </main>
              
              <footer style={{ 
                backgroundColor: 'white', 
                borderTop: '1px solid #e5e7eb', 
                padding: '2rem 0', 
                marginTop: '4rem' 
              }}>
                <div style={{ 
                  maxWidth: '1200px', 
                  margin: '0 auto', 
                  padding: '0 1rem', 
                  textAlign: 'center', 
                  color: '#6b7280' 
                }}>
                  <div style={{ marginBottom: '1rem' }}>
                    <h3 style={{ 
                      fontSize: '1.125rem', 
                      fontWeight: '600', 
                      color: '#1f2937', 
                      marginBottom: '0.5rem' 
                    }}>
                      Electra
                    </h3>
                    <p style={{ fontSize: '0.875rem' }}>
                      Secure, Transparent, Democratic - Blockchain-powered voting for the future
                    </p>
                  </div>
                  
                  <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
                    gap: '1.5rem', 
                    marginBottom: '1.5rem' 
                  }}>
                    <div>
                      <h4 style={{ 
                        fontWeight: '500', 
                        color: '#1f2937', 
                        marginBottom: '0.5rem' 
                      }}>
                        Security
                      </h4>
                      <p style={{ fontSize: '0.75rem' }}>
                        Cryptographic protection ensures vote integrity and prevents tampering
                      </p>
                    </div>
                    <div>
                      <h4 style={{ 
                        fontWeight: '500', 
                        color: '#1f2937', 
                        marginBottom: '0.5rem' 
                      }}>
                        Transparency
                      </h4>
                      <p style={{ fontSize: '0.75rem' }}>
                        All votes are publicly verifiable on the blockchain
                      </p>
                    </div>
                    <div>
                      <h4 style={{ 
                        fontWeight: '500', 
                        color: '#1f2937', 
                        marginBottom: '0.5rem' 
                      }}>
                        Democracy
                      </h4>
                      <p style={{ fontSize: '0.75rem' }}>
                        Empowering citizens with trustworthy electoral processes
                      </p>
                    </div>
                  </div>
                  
                  <div style={{ 
                    borderTop: '1px solid #e5e7eb', 
                    paddingTop: '1rem' 
                  }}>
                    <p style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                      © 2024 Electra - Proof of Concept | Built for Nigerian Electoral Reform | Powered by Ethereum Blockchain
                    </p>
                    <p style={{ 
                      fontSize: '0.75rem', 
                      color: '#9ca3af', 
                      marginTop: '0.25rem' 
                    }}>
                      Created by God's Favour Chukwudi
                    </p>
                  </div>
                </div>
              </footer>
            </div>
          </Router>
        </ElectionProvider>
      </Web3Provider>
    </div>
  );
}

export default App;

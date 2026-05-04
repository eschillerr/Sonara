import logo from './logo.svg';
import './static/css/App.css';
import Home from './home';
import Login from './login';
import Register from './register';
import TestSession from './TestSession';
import Profile from './Profile';
import UserProfile from './UserProfile';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

function App() {
  return (
    <Router>
      <div className="App">
        <header className="App-header">
          <Routes>
            <Route path="/" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/home" element={<Home />} />
            <Route path="/test-session" element={<TestSession />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/user/:id" element={<UserProfile />} />
          </Routes>
        </header>
      </div>
    </Router>
  );
}

export default App;

import './static/css/navbar.css';


function Navbar() {
    return (
        <nav className="navbar">
            {/* 1. SONARA Logo */}
            <a href="/" className="navbar-logo">
                SONARA
            </a>



            {/* Navigation Icons */}
            <div className="nav-icons">
                {/* 2. Home Button */}
                <a href="/home" className="nav-icon" title="Home">⌂</a>
                {/* 3. Explore Button */}
                <a href="/explore" className="nav-icon" title="Explore">🌐</a>
                {/* 5. Profile Symbol */}
                <a href="/test-session" className="nav-icon" title="Profile">👤</a>
            </div>
        </nav>
    );
}

export default Navbar;
import './static/css/navbar.css';


function Navbar() {
    return (
        <div className="navbar">
            <button class="menu-toggle" onclick="toggleMenu()">☰</button>
            <div class="nav-icons">
                <a href="index.html" class="nav-icon" title="Home">⌂</a>
                <a href="explorar.html" class="nav-icon" title="Explore">🌐</a>
                <a href="pagina_interna.html" class="nav-icon" title="Profile">👤</a>
                <a href="tabla.html" class="nav-icon" title="Search">🔍</a>
                <a href="direct_messages.html" class="nav-icon" title="Messages">💬</a>
            </div>
        </div>
    );
}

export default Navbar;
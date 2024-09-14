import logo from './img/logo.png';
import './styles/HomePage.css';

function HomePage() {
  return (
    <div className="App">
      <header className="App-header">
        <a href="/calendario"><img src={logo} className="App-logo" alt="logo" /></a>
        <p>
          Alexandre <code>src/App.js</code> <a href="/formulario" style={{color: 'yellow', textDecoration: 'none'}} > BANANA</a>
        </p>
      </header>
    </div>
  );
}

export default HomePage;

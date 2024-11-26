import { useState } from "react";
import reactLogo from "./assets/react.svg";
import viteLogo from "/vite.svg";
import Hero from "./components/Hero";
import "./App.css";
import Sponsors from "./components/Sponsors";

function App() {
  const [count, setCount] = useState(0);

  return (
    <>
      <main className="flex-grow pattern">
        <div className="min-h-screen flex flex-col bg-background-950 text-text-50 select-none">
          <Hero />{" "}
        </div>
      </main>
    </>
  );
}

export default App;

import React from "react";
import { Link } from "react-router-dom";

export default function App() {
  return (
    <div style={{ padding: 20, fontFamily: "Arial" }}>
      <h1>📑 Sistema de Holerite</h1>
      <p>Escolha uma opção:</p>
      <ul>
        <li><Link to="/holerite">Gerar Holerite</Link></li>
        <li><Link to="/lucro">Relatório de Lucro</Link></li>
      </ul>
    </div>
  );
}
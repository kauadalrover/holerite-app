import React, { useState, useEffect } from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export default function HoleriteApp() {
  const [dias, setDias] = useState([]);
  const [nome, setNome] = useState("");
  const [cpf, setCpf] = useState("");
  const [cnpj, setCnpj] = useState("");
  const [empresa, setEmpresa] = useState("");
  const [entrada, setEntrada] = useState("");
  const [saida, setSaida] = useState("");
  const [intervaloIni, setIntervaloIni] = useState("");
  const [intervaloFim, setIntervaloFim] = useState("");
  const [funcao, setFuncao] = useState("normal");
  const [data, setData] = useState("");

  // valores das diárias (empresa paga ao trabalhador)
  const VALORES_DIARIA = {
    normal: 100,
    conferente: 110,
    fiscal: 130,
  };

  // valores das diárias (empresa recebe das contratantes)
  const RECEITA_DIARIA = {
    normal: 190,
    conferente: 190,
    fiscal: 230,
  };

  useEffect(() => {
    try {
      setDias(JSON.parse(localStorage.getItem("dias") || "[]"));
    } catch {
      setDias([]);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("dias", JSON.stringify(dias));
  }, [dias]);

  const calcularHoras = (entrada, saida, intervaloIni, intervaloFim) => {
    const parseDateTime = (dt, t) => new Date(`${dt}T${t}`);
    let hE = parseDateTime(data, entrada);
    let hS = parseDateTime(data, saida);
    if (hS <= hE) hS.setDate(hS.getDate() + 1);

    let total = (hS - hE) / 36e5;

    if (intervaloIni && intervaloFim) {
      let iI = parseDateTime(data, intervaloIni);
      let iF = parseDateTime(data, intervaloFim);
      if (iF <= iI) iF.setDate(iF.getDate() + 1);
      total -= (iF - iI) / 36e5;
    }

    return Math.max(0, total);
  };

  const adicionarDia = () => {
    if (!data || !entrada || !saida) return;
    const horas = calcularHoras(entrada, saida, intervaloIni, intervaloFim);
    const extras = Math.max(0, horas - 8);

    const novoDia = {
      data,
      empresa,
      funcao,
      entrada,
      saida,
      intervaloIni,
      intervaloFim,
      horas,
      extras,
    };
    setDias([...dias, novoDia]);
    setData("");
    setEntrada("");
    setSaida("");
    setIntervaloIni("");
    setIntervaloFim("");
  };

  const removerDia = (i) => {
    setDias(dias.filter((_, idx) => idx !== i));
  };

  const gerarPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(14);
    doc.text("Holerite - Prestador de Serviço", 14, 18);
    doc.setFontSize(12);
    doc.text(`Prestador: ${nome}`, 14, 28);
    doc.text(`CPF: ${cpf}`, 14, 34);
    doc.text(`CNPJ: ${cnpj}`, 14, 40);

    const body = dias.map((d) => {
      const valorDiaria = VALORES_DIARIA[d.funcao];
      const valorExtras = d.extras * 20;
      let alim = 0;
      let trans = 0;

      if (d.horas >= 8) {
        alim += 33;
        trans += 18;
      }
      if (d.extras > 4) {
        alim += 33; // segunda alimentação
      }

      const total = valorDiaria + valorExtras + alim + trans;

      return [
        d.data,
        d.empresa,
        d.funcao,
        d.entrada + " - " + d.saida,
        d.horas.toFixed(2),
        d.extras.toFixed(2),
        "R$ " + valorDiaria.toFixed(2),
        "R$ " + valorExtras.toFixed(2),
        "R$ " + alim.toFixed(2),
        "R$ " + trans.toFixed(2),
        "R$ " + total.toFixed(2),
      ];
    });

    autoTable(doc, {
      startY: 48,
      head: [
        [
          "Data",
          "Empresa",
          "Função",
          "Horário",
          "Horas",
          "Extras",
          "Diária",
          "Extras (R$)",
          "Alim.",
          "Transp.",
          "Total",
        ],
      ],
      body,
    });

    doc.save("holerite.pdf");
  };

  return (
    <div style={{ padding: 20, fontFamily: "Arial" }}>
      <h2>📄 Gerador de Holerite</h2>

      <div>
        <label>Prestador de Serviço: </label>
        <input value={nome} onChange={(e) => setNome(e.target.value)} />
      </div>
      <div>
        <label>CPF: </label>
        <input value={cpf} onChange={(e) => setCpf(e.target.value)} />
      </div>
      <div>
        <label>CNPJ: </label>
        <input value={cnpj} onChange={(e) => setCnpj(e.target.value)} />
      </div>

      <hr />

      <h3>Lançar dia trabalhado</h3>
      <div>
        <label>Data: </label>
        <input type="date" value={data} onChange={(e) => setData(e.target.value)} />
      </div>
      <div>
        <label>Empresa: </label>
        <input value={empresa} onChange={(e) => setEmpresa(e.target.value)} />
      </div>
      <div>
        <label>Função: </label>
        <select value={funcao} onChange={(e) => setFuncao(e.target.value)}>
          <option value="normal">Normal</option>
          <option value="conferente">Conferente</option>
          <option value="fiscal">Fiscal</option>
        </select>
      </div>
      <div>
        <label>Entrada: </label>
        <input type="time" value={entrada} onChange={(e) => setEntrada(e.target.value)} />
        <label> Saída: </label>
        <input type="time" value={saida} onChange={(e) => setSaida(e.target.value)} />
      </div>
      <div>
        <label>Intervalo: </label>
        <input type="time" value={intervaloIni} onChange={(e) => setIntervaloIni(e.target.value)} />
        <input type="time" value={intervaloFim} onChange={(e) => setIntervaloFim(e.target.value)} />
      </div>
      <button onClick={adicionarDia}>Adicionar</button>

      <h3>Dias lançados</h3>
      <table border="1" cellPadding="4">
        <thead>
          <tr>
            <th>Data</th>
            <th>Empresa</th>
            <th>Função</th>
            <th>Horas</th>
            <th>Extras</th>
            <th>Diária</th>
            <th>Extras (R$)</th>
            <th>Alim.</th>
            <th>Transp.</th>
            <th>Total</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {dias.map((d, i) => {
            const valorDiaria = VALORES_DIARIA[d.funcao];
            const valorExtras = d.extras * 20;
            let alim = 0;
            let trans = 0;

            if (d.horas >= 8) {
              alim += 33;
              trans += 18;
            }
            if (d.extras > 4) {
              alim += 33;
            }

            const total = valorDiaria + valorExtras + alim + trans;

            return (
              <tr key={i}>
                <td>{d.data}</td>
                <td>{d.empresa}</td>
                <td>{d.funcao}</td>
                <td>{d.horas.toFixed(2)}</td>
                <td>{d.extras.toFixed(2)}</td>
                <td>R$ {valorDiaria}</td>
                <td>R$ {valorExtras.toFixed(2)}</td>
                <td>R$ {alim.toFixed(2)}</td>
                <td>R$ {trans.toFixed(2)}</td>
                <td>R$ {total.toFixed(2)}</td>
                <td>
                  <button onClick={() => removerDia(i)}>❌</button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <button onClick={gerarPDF}>Gerar PDF</button>
      <br />
      <a href="/lucro">➡️ Ir para Relatório de Lucro</a>
    </div>
  );
}

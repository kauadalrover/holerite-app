import React, { useEffect, useState, useMemo } from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const currency = (v) =>
  (isFinite(v) ? v : 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });

export default function LucroApp() {
  const [dias, setDias] = useState([]);
  const [outrosCustosMensais, setOutrosCustosMensais] = useState(0);
  const [descontosAdicionais, setDescontosAdicionais] = useState(0);

  const VALORES_DIARIA = {
    normal: 100,
    conferente: 110,
    fiscal: 130,
  };

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

  const calcularExtras = (d) => {
    const parseDateTime = (dt, t) => new Date(`${dt}T${t}`);
    let hE = parseDateTime(d.data, d.entrada);
    let hS = parseDateTime(d.data, d.saida);
    if (hS <= hE) hS.setDate(hS.getDate() + 1);

    let total = (hS - hE) / 36e5;

    if (d.intervaloIni && d.intervaloFim) {
      let iI = parseDateTime(d.data, d.intervaloIni);
      let iF = parseDateTime(d.data, d.intervaloFim);
      if (iF <= iI) iF.setDate(iF.getDate() + 1);
      total -= (iF - iI) / 36e5;
    }

    return Math.max(0, total - 8);
  };

  const verificarSeEhNoturno = (d) => {
    const parseDateTime = (dt, t) => new Date(`${dt}T${t}`);
    let hE = parseDateTime(d.data, d.entrada);
    let hS = parseDateTime(d.data, d.saida);
    if (hS <= hE) hS.setDate(hS.getDate() + 1);

    let hora = new Date(hE);
    while (hora < hS) {
      const h = hora.getHours();
      if (h >= 22 || h < 5) return true;
      hora.setHours(hora.getHours() + 1);
    }
    return false;
  };

  // Receita da Empresa
  const receitaDiarias = useMemo(
    () => dias.reduce((soma, d) => soma + RECEITA_DIARIA[d.funcao], 0),
    [dias]
  );

  const receitaExtras = useMemo(() => {
    return dias.reduce((soma, d) => {
      const horasExtras = calcularExtras(d);
      let percentual = 0;
      const data = new Date(d.data);
      const diaSemana = data.getDay();
      const isNoturno = verificarSeEhNoturno(d);

      if (isNoturno) percentual = 70;
      else if (diaSemana === 0) percentual = 100;
      else if (d.feriado) percentual = 120;
      else percentual = 50;

      const valorHoraEmpresa = 23.75 * (1 + percentual / 100);
      return soma + horasExtras * valorHoraEmpresa;
    }, 0);
  }, [dias]);

  const receitaEmpresa = receitaDiarias + receitaExtras;

  // Receita do Trabalhador
  const receitaTrabalhadorDiarias = useMemo(
    () => dias.reduce((soma, d) => soma + VALORES_DIARIA[d.funcao], 0),
    [dias]
  );

  const receitaTrabalhadorExtras = useMemo(
    () => dias.reduce((soma, d) => soma + calcularExtras(d) * 20, 0),
    [dias]
  );

  const receitaTrabalhadorAlim = useMemo(() => {
    return dias.reduce((soma, d) => {
      let alim = 0;
      if (d.horas >= 8) alim += 33;
      if (d.extras > 4) alim += 33;
      return soma + alim;
    }, 0);
  }, [dias]);

  const receitaTrabalhadorTrans = useMemo(() => {
    return dias.reduce((soma, d) => {
      let trans = 0;
      if (d.horas >= 8) trans += 18;
      return soma + trans;
    }, 0);
  }, [dias]);

  const receitaTrabalhadorTotal =
    receitaTrabalhadorDiarias +
    receitaTrabalhadorExtras +
    receitaTrabalhadorAlim +
    receitaTrabalhadorTrans;

  // Custos da Empresa
  const custosEmpresa =
    receitaTrabalhadorDiarias +
    receitaTrabalhadorExtras +
    outrosCustosMensais +
    descontosAdicionais;

  // Lucro líquido
  const lucro = receitaEmpresa - custosEmpresa;

  const gerarPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(14);
    doc.text("Relatório de Lucro - LOGSERV", 14, 18);
    autoTable(doc, {
      startY: 26,
      head: [["Categoria", "Valor"]],
      body: [
        ["Receita Empresa - Diárias", currency(receitaDiarias)],
        ["Receita Empresa - Horas Extras", currency(receitaExtras)],
        ["Receita Empresa - Total", currency(receitaEmpresa)],
        ["---", "---"],
        ["Receita Trabalhador - Diárias", currency(receitaTrabalhadorDiarias)],
        ["Receita Trabalhador - Horas Extras", currency(receitaTrabalhadorExtras)],
        ["Receita Trabalhador - Alimentação", currency(receitaTrabalhadorAlim)],
        ["Receita Trabalhador - Transporte", currency(receitaTrabalhadorTrans)],
        ["Receita Trabalhador - Total", currency(receitaTrabalhadorTotal)],
        ["---", "---"],
        ["Custos Empresa (diárias + extras + outros)", currency(custosEmpresa)],
        ["Outros Custos (mensal)", currency(outrosCustosMensais)],
        ["Descontos Adicionais", currency(descontosAdicionais)],
        ["---", "---"],
        ["Lucro Final", currency(lucro)],
      ],
    });
    doc.save("relatorio-lucro.pdf");
  };

  return (
    <div style={{ padding: 20, fontFamily: "Arial", maxWidth: 900, margin: "0 auto" }}>
      <h2>📊 Relatório de Lucro</h2>

      <section style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <div>
          <h3>Configurações de Custos</h3>
          <div style={{ marginTop: 6 }}>
            <label>Outros custos mensais: </label>
            <input
              type="number"
              step="0.01"
              value={outrosCustosMensais}
              onChange={(e) =>
                setOutrosCustosMensais(parseFloat(e.target.value) || 0)
              }
            />
          </div>
          <div style={{ marginTop: 6 }}>
            <label>Descontos adicionais: </label>
            <input
              type="number"
              step="0.01"
              value={descontosAdicionais}
              onChange={(e) =>
                setDescontosAdicionais(parseFloat(e.target.value) || 0)
              }
            />
          </div>
        </div>
      </section>

      <hr style={{ margin: "16px 0" }} />

      <h3>Receita da Empresa</h3>
      <p>Diárias: {currency(receitaDiarias)}</p>
      <p>Horas Extras: {currency(receitaExtras)}</p>
      <p><b>Total Empresa:</b> {currency(receitaEmpresa)}</p>

      <h3>Receita do Trabalhador</h3>
      <p>Diárias: {currency(receitaTrabalhadorDiarias)}</p>
      <p>Horas Extras: {currency(receitaTrabalhadorExtras)}</p>
      <p>Alimentação: {currency(receitaTrabalhadorAlim)}</p>
      <p>Transporte: {currency(receitaTrabalhadorTrans)}</p>
      <p><b>Total Trabalhador:</b> {currency(receitaTrabalhadorTotal)}</p>

      <h3>Custos da Empresa</h3>
      <p>Pagamentos ao Trabalhador (diárias + extras): {currency(receitaTrabalhadorDiarias + receitaTrabalhadorExtras)}</p>
      <p>Outros Custos (mensal): {currency(outrosCustosMensais)}</p>
      <p>Descontos Adicionais: {currency(descontosAdicionais)}</p>

      <hr />
      <h2>Lucro Final: {currency(lucro)}</h2>

      <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
        <button onClick={gerarPDF}>Gerar PDF</button>
        <a href="/holerite">⬅️ Voltar ao Holerite</a>
      </div>
    </div>
  );
}

const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const path = require('path');

const app = express();
const port = 5000;

// Lista de feriados
const feriados = [
  '2024-01-01', // Ano Novo
  '2024-02-12', // Carnaval
  '2024-02-13', // Carnaval
  '2024-02-14', // Carnaval
  '2024-02-28', // Facultativo
  '2024-03-19', // Dia de São José
  '2024-03-28', // Quinta-feira Santa
  '2024-03-29', // Sexta-Feira Santa
  '2024-04-21', // Dia de Tiradentes
  '2024-05-01', // Dia do Trabalho
  '2024-05-30', // Corpus Christi
  '2024-06-29', // São Pedro
  '2024-06-30', // Emancipação
  '2024-07-09', // Revolução Constitucionalista
  '2024-07-26', // Fundação da Cidade de Goiás
  '2024-09-07', // Independência do Brasil
  '2024-10-12', // Nossa Senhora Aparecida
  '2024-10-15', // Dia do Professor
  '2024-10-24', // Pedra fundamental de Goiânia
  '2024-10-28', // Dia do Servidor Público
  '2024-10-28', // Servidor público
  '2024-10-28', // Ponto Facultativo Municipal
  '2024-10-31', // Dia do Evangélico
  '2024-11-02', // Dia de Finados
  '2024-11-15', // Proclamação da República
  '2024-11-20', // Dia da Consciência Negra
  '2024-12-08', // Ponto Facultativo
  '2024-12-08', // Dia da Imaculada Conceição
  '2024-12-08', // N. Sra. da Conceição
  '2024-12-25', // Natal
  '2024-12-31'  // Após o meio-dia, Véspera de Ano Novo
  //https://feriados.site/sp/mogi-das-cruzes
  ];

// Middleware
app.use(cors());
app.use(express.json());

// Configuração do SQLite
const dbPath = path.resolve(__dirname, 'database.db');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) return console.error('Erro ao conectar ao banco de dados:', err.message);
  
  console.log('Conectado ao banco de dados SQLite');
  db.run(`
    CREATE TABLE IF NOT EXISTS vendas (
      id VARCHAR(6) PRIMARY KEY,
      vendedor TEXT NOT NULL,
      cliente TEXT NOT NULL,
      clienteFinal TEXT NOT NULL,
      cortes INTEGER NOT NULL,
      dataEntrada DATE NOT NULL,
      dataEntrega DATE NOT NULL
    )`, 
    (err) => err && console.error('Erro ao criar a tabela vendas:', err.message)
  );
});

// Rota para obter feriados
app.get('/feriados', (req, res) => res.json(feriados));

// Rota para obter todos os pedidos
app.get('/pedidos', (req, res) => {
  db.all('SELECT * FROM vendas', [], (err, rows) => {
    if (err) {
      console.error('Erro ao obter pedidos:', err.message);
      return res.status(500).json({ error: 'Erro ao obter pedidos.' });
    }
    res.json(rows);
  });
});

// Rota para deletar um pedido
app.delete('/del-pedido/:id', (req, res) => {
  const { id } = req.params;

  if (typeof id !== 'string' || id.length !== 6) {
    return res.status(400).json({ error: 'ID inválido. O ID deve ter exatamente 6 caracteres.' });
  }

  const query = 'DELETE FROM vendas WHERE id = ?';
  db.run(query, [id.trim()], function (err) {
    if (err) return res.status(500).json({ error: 'Erro ao deletar pedido.' });

    if (this.changes === 0) return res.status(404).json({ error: 'Pedido não encontrado.' });

    res.json({ message: 'Pedido deletado com sucesso.' });
  });
});

// Rota para adicionar um novo pedido
app.post('/add-pedido', (req, res) => {
  const { id, vendedor, cliente, clienteFinal, cortes, dataEntrada } = req.body;

  console.log('Recebendo novo pedido:', { id, vendedor, cliente, clienteFinal, cortes, dataEntrada });

  // Validação básica dos dados
  if (![id, vendedor, cliente, clienteFinal, cortes, dataEntrada].every(Boolean)) {
    console.error('Dados insuficientes fornecidos:', { id, vendedor, cliente, clienteFinal, cortes, dataEntrada });
    return res.status(400).json({ error: 'Dados insuficientes fornecidos.' });
  }

  db.get('SELECT id FROM vendas WHERE id = ?', [id], (err, row) => {
    if (err) {
      console.error('Erro ao verificar a existência do pedido:', err.message);
      return res.status(500).json({ error: 'Erro ao verificar a existência do pedido.' });
    }

    if (row) {
      console.error('Já existe um pedido com este ID:', id);
      return res.status(409).json({ error: 'Já existe um pedido com este ID.' });
    }

    // Cria um objeto Date para dataEntrada e avança 10 dias
    const dataEntradaObj = new Date(dataEntrada);
    dataEntradaObj.setDate(dataEntradaObj.getDate() + 10);

    verificarCapacidade(dataEntradaObj, cortes, id, (err, dataEntregaFinal, totalCortes) => {
      if (err) {
        console.error('Erro ao calcular a data de entrega:', err.message);
        return res.status(500).json({ error: 'Erro ao calcular a data de entrega.' });
      }

      const query = `INSERT INTO vendas (id, vendedor, cliente, clienteFinal, cortes, dataEntrada, dataEntrega) 
                     VALUES (?, ?, ?, ?, ?, ?, ?)`;
      db.run(query, [id, vendedor, cliente, clienteFinal, totalCortes, dataEntrada, dataEntregaFinal], function (err) {
        if (err) {
          console.error('Erro ao registrar pedido:', err.message);
          return res.status(500).json({ error: 'Erro ao registrar pedido.' });
        }

        console.log('Pedido registrado com sucesso:', { id, vendedor, cliente, clienteFinal, totalCortes, dataEntrada, dataEntregaFinal });
        res.json({ id, vendedor, cliente, clienteFinal, totalCortes, dataEntrada, dataEntregaFinal });
      });
    });
  });
});

const verificarCapacidade = (data, cortes, idOriginal, callback) => {
  const maxCortesPorDia = 2000;
  let totalCortes = 0;
  let ultimaDataEntrega;

  const criarPedido = (data, cortesRestantes) => {
    const dataFormatada = data.toISOString().split('T')[0];

    if (isFeriado(data)) {
      data.setDate(data.getDate() + 1);
      console.log(`Data ${dataFormatada} é feriado. Avançando para o próximo dia.`);
      return criarPedido(data, cortesRestantes);
    }

    db.get('SELECT SUM(cortes) AS totalCortes FROM vendas WHERE dataEntrega = ?', [dataFormatada], (err, row) => {
      if (err) {
        console.error('Erro ao obter a soma dos cortes:', err.message);
        return callback(err);
      }

      const cortesHoje = row?.totalCortes || 0;
      const cortesDisponiveis = maxCortesPorDia - cortesHoje;
      const cortesParcial = Math.min(cortesDisponiveis, cortesRestantes);

      console.log(`Data ${dataFormatada} tem ${cortesHoje} cortes hoje. Adicionando ${cortesParcial} cortes.`);

      totalCortes += cortesParcial;
      ultimaDataEntrega = dataFormatada;

      const cortesRemanescentes = cortesRestantes - cortesParcial;

      if (cortesRemanescentes > 0) {
        // Avançar para o próximo dia e continuar a verificação
        data.setDate(data.getDate() + 1);
        return criarPedido(data, cortesRemanescentes);
      } else {
        // Retorna a última data de entrega com todos os cortes consolidados
        callback(null, ultimaDataEntrega, totalCortes);
      }
    });
  };

  criarPedido(data, cortes);
};


const isFeriado = (data) => feriados.includes(data.toISOString().split('T')[0]);

app.listen(port, () => console.log(`Servidor rodando na porta ${port}`));

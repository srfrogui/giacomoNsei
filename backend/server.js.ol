const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const path = require('path');

const app = express();
const port = 5000;

// Lista de feriados (exemplo)
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
  if (err) {
    console.error('Erro ao conectar ao banco de dados:', err.message);
  } else {
    console.log('Conectado ao banco de dados SQLite');
    db.serialize(() => {
      db.run(`CREATE TABLE IF NOT EXISTS vendas (
          id VARCHAR(6) PRIMARY KEY,
          vendedor TEXT,
          cliente TEXT,
          clienteFinal TEXT,
          cortes INTEGER,
          dataEntrada DATE,
          dataEntrega DATE
        )`, (err) => {
        if (err) {
          console.error('Erro ao criar a tabela vendas:', err.message);
        }
      });
    });
  }
});

// Armazenar o timestamp do último pedido
let lastPedidoTimestamp = 0;

// Rota para obter feriados
app.get('/feriados', (req, res) => {
  res.json(feriados);
});

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
  let { id } = req.params;

  // Valida o formato do ID
  if (typeof id !== 'string' || id.length !== 6) {
    return res.status(400).json({ error: 'ID inválido. O ID deve ter exatamente 6 caracteres.' });
  }

  // Converte o ID para o formato esperado, se necessário
  id = id.trim(); // Remove espaços em branco se houver

  const query = 'DELETE FROM vendas WHERE id = ?';
  db.run(query, [id], function (err) {
    if (err) {
      console.error('Erro ao deletar pedido:', err.message);
      return res.status(500).json({ error: 'Erro ao deletar pedido.' });
    }

    if (this.changes === 0) {
      return res.status(404).json({ error: 'Pedido não encontrado.' });
    }

    console.log('Pedido deletado com sucesso:', id);
    res.json({ message: 'Pedido deletado com sucesso.' });
  });
});

// Rota para adicionar um novo pedido
app.post('/add-pedido', (req, res) => {
  console.log('Pedido recebido:', req.body);

  const { id, vendedor, cliente, clienteFinal, cortes, dataEntrada } = req.body;
  const now = Date.now();

  // Atualiza o timestamp do último pedido
  lastPedidoTimestamp = now;

  // Validação básica dos dados
  if (!id || !vendedor || !cliente || !clienteFinal || !cortes || !dataEntrada) {
    return res.status(400).json({ error: 'Dados insuficientes fornecidos.' });
  }

  console.log('Processando pedido:', req.body);

  // Verifica se o ID já existe na tabela
  db.get('SELECT id FROM vendas WHERE id = ?', [id], (err, row) => {
    if (err) {
      console.error('Erro ao verificar a existência do pedido:', err.message);
      return res.status(500).json({ error: 'Erro ao verificar a existência do pedido.' });
    }

    if (row) {
      // Se o ID já existir, retorna um erro
      return res.status(409).json({ error: 'Já existe um pedido com este ID.' });
    }

    // Calcula a data de entrega começando 10 dias após a data de entrada
    calcularDataEntrega(cortes, dataEntrada, (dataEntrega) => {
      const query = `INSERT INTO vendas (id, vendedor, cliente, clienteFinal, cortes, dataEntrada, dataEntrega) VALUES (?, ?, ?, ?, ?, ?, ?)`;
      db.run(query, [id, vendedor, cliente, clienteFinal, cortes, dataEntrada, dataEntrega], function (err) {
        if (err) {
          console.error('Erro ao registrar pedido:', err.message);
          return res.status(500).json({ error: 'Erro ao registrar pedido.' });
        }

        console.log('Pedido processado com sucesso:', {
          id,
          vendedor,
          cliente,
          clienteFinal,
          cortes,
          dataEntrada,
          dataEntrega
        });

        res.json({
          id,
          vendedor,
          cliente,
          clienteFinal,
          cortes,
          dataEntrada,
          dataEntrega,
        });
      });
    });
  });
});

function calcularDataEntrega(cortes, dataEntrada, callback) {
  let dataEntrega = new Date(dataEntrada);
  dataEntrega.setDate(dataEntrega.getDate() + 10); // Começa a partir de 10 dias após a data de entrada

  function verificarCapacidade(data, callback) {
    const dataFormatada = data.toISOString().split('T')[0]; // Formata a data no formato YYYY-MM-DD

    // Verifica se a data é um feriado
    if (feriados.includes(dataFormatada)) {
      data.setDate(data.getDate() + 1);
      verificarCapacidade(data, callback);
      return;
    }

    db.get('SELECT SUM(cortes) as totalCortes FROM vendas WHERE dataEntrega = ?', [dataFormatada], (err, row) => {
      if (err) {
        console.error('Erro ao verificar a capacidade de cortes:', err.message);
        return callback(err);
      }

      const cortesHoje = row.totalCortes || 0;
      if (cortesHoje + cortes >= 2000) {
        // Capacidade suficiente para o dia atual
        return callback(null, dataFormatada);
      } else {
        // Capacidade excedida, tentar o próximo dia
        data.setDate(data.getDate() + 1);
        verificarCapacidade(data, callback);
      }
    });
  }

  // Inicia a verificação com a data 10 dias após a data de entrada
  verificarCapacidade(dataEntrega, (err, dataEntregaFormatada) => {
    if (err) {
      callback('Erro ao calcular a data de entrega.');
    } else {
      callback(dataEntregaFormatada);
    }
  });
}

app.listen(port, () => {
  console.log(`Servidor rodando na porta ${port}`);
});

import React, { useState, useEffect } from 'react';
import Calendar from 'react-calendar';
import axios from 'axios';
import 'react-calendar/dist/Calendar.css';
import './styles/CalendarPage.css';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { DataGrid } from '@mui/x-data-grid';

const CalendarPage = () => {
  const [date, setDate] = useState(new Date());
  const [pedidos, setPedidos] = useState([]);
  const [cortesPorDia, setCortesPorDia] = useState({});

  useEffect(() => {
    let timeoutId;
  
    const startFetching = async () => {
      try {
        const response = await axios.get('http://localhost:5000/pedidos');
        setPedidos(response.data);
        calcularCortesPorDia(response.data);
      } catch (error) {
        toast.error('Erro ao carregar pedidos.');
      }
      timeoutId = setTimeout(startFetching, 30000); // Atualiza a cada 30 segundos
    };
  
    startFetching(); // Inicia o ciclo de chamadas
  
    return () => clearTimeout(timeoutId); // Limpa o timeout ao desmontar o componente
  }, []);

  const calcularCortesPorDia = (pedidos) => {
    const cortesPorDia = {};
    pedidos.forEach((pedido) => {
      const data = new Date(pedido.dataEntrega).toISOString().split('T')[0];
      if (!cortesPorDia[data]) {
        cortesPorDia[data] = 0;
      }
      cortesPorDia[data] += pedido.cortes;
    });
    setCortesPorDia(cortesPorDia);
  };

  const handleDateChange = (newDate) => {
    setDate(newDate);
  };

  const formatDate = (date) => {
    return date.toISOString().split('T')[0];
  };

  const selectedDate = formatDate(date);
  const cortesHoje = cortesPorDia[selectedDate] || 0;

  // Filtrar pedidos para o dia selecionado
  const pedidosHoje = pedidos.filter(pedido => {
    const dataEntrega = new Date(pedido.dataEntrega).toISOString().split('T')[0];
    return dataEntrega === selectedDate;
  });

  const columns = [
    { field: 'id', headerName: 'ID', width: 90 },
    { field: 'vendedor', headerName: 'Vendedor', width: 150 },
    { field: 'cliente', headerName: 'Cliente', width: 150 },
    { field: 'cortes', headerName: 'Cortes', width: 110 },
    { field: 'dataEntrada', headerName: 'Data de Entrada', width: 150 },
    { field: 'dataEntrega', headerName: 'Data de Entrega', width: 150 },
  ];

  return (
    <div className="calendar-page">
      <div className="calendar-container">
        <h1>Calendário de Pedidos</h1>
        <Calendar
          onChange={handleDateChange}
          value={date}
          tileClassName={({ date }) => {
            const day = formatDate(date);
            if (cortesPorDia[day] >= 2000) {
              return 'highlight-high';
            } else if (cortesPorDia[day] >= 1000) {
              return 'highlight';
            } else if (cortesPorDia[day] >= 500) {
              return 'light';
            }
            return null;
          }}
        />
        <div className="selected-date">
          <h2>Pedidos para {selectedDate}</h2>
          <p style={{ color: cortesPorDia[selectedDate] > 2000 ? 'red' : 'black' }}>
            Quantidade de Cortes: {cortesHoje}
          </p>
        </div>
        <div style={{ height: 400, width: '100%' }}>
          <DataGrid
            rows={pedidosHoje}
            columns={columns}
            pageSize={5}
            rowsPerPageOptions={[5]}
          />
        </div>
      </div>
      <ToastContainer
          position="bottom-left"  // Posição no canto inferior esquerdo
          limit={5}  // Máximo de 5 notificações
          autoClose={2000}  // Fechar automaticamente após 2 segundos
          closeOnClick
          pauseOnFocusLoss
          draggable
          pauseOnHover
        />
    </div>
  );
};

export default CalendarPage;

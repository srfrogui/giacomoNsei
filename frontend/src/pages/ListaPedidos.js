import React from 'react';
import { DataGrid } from '@mui/x-data-grid';

// Função para formatar a data no formato "dd/mm/aaaa"
const formatDate = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('pt-BR'); // Formato "dd/mm/aaaa"
};

const PedidosList = ({ pedidos }) => {
  const columns = [
    { field: 'id', headerName: 'ID', width: 90 },
    { field: 'vendedor', headerName: 'Vendedor', width: 150 },
    { field: 'cliente', headerName: 'Cliente', width: 150 },
    { field: 'cortes', headerName: 'Cortes', width: 110 },
    {
      field: 'dataEntrada',
      headerName: 'Data de Entrada',
      width: 150,
      valueFormatter: (params) => formatDate(params.value), // Formatar a data
    },
    {
      field: 'dataEntrega',
      headerName: 'Data de Entrega',
      width: 150,
      valueFormatter: (params) => formatDate(params.value), // Formatar a data
    },
  ];

  return (
    <div style={{ height: 800, width: '100%' }}>
      <DataGrid
        rows={pedidos}
        columns={columns}
        pageSize={5}
        rowsPerPageOptions={[5]}
      />
    </div>
  );
};

export default PedidosList;

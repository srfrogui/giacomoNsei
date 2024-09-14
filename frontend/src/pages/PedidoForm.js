import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import ListaPedidos from './ListaPedidos';
import './styles/PedidoForm.css'; 

const PedidoForm = () => {
  const [pedido, setPedido] = useState({
    id: '',
    vendedor: '',
    cliente: '',
    clienteFinal: '',
    cortes: '',
    dataEntrada: '',
  });
  const [pedidos, setPedidos] = useState([]);

  useEffect(() => {
    let timeoutId;
  
    const fetchPedidos = async () => {
      try {
        const response = await axios.get('http://localhost:5000/pedidos');
        setPedidos(response.data);
      } catch (error) {
        toast.error('Erro ao carregar pedidos.');
      }
    };
  
    const startFetching = () => {
      fetchPedidos(); // Chama o fetchPedidos inicialmente
      timeoutId = setTimeout(startFetching, 5000); // Define a chamada recursiva para 3 segundos
    };
  
    startFetching(); // Inicia o ciclo de chamadas a cada 3 segundos
  
    // Limpa o timeout ao desmontar o componente
    return () => clearTimeout(timeoutId);
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'id') {
      // Remove caracteres não numéricos e formata o ID
      const formattedValue = value.replace(/\D/g, '').slice(0, 6);
      setPedido((prev) => ({
        ...prev,
        [name]: formatID(formattedValue),
      }));
    } else {
      setPedido((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const formatID = (id) => {
    // Formata o ID com um ponto no meio
    if (id.length > 3) {
      return id.slice(0, 3) + '.' + id.slice(3);
    }
    return id;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
  
    // Verifica se todos os campos obrigatórios estão preenchidos
    const { id, vendedor, cliente, clienteFinal, cortes, dataEntrada } = pedido;
    if (!id || !vendedor || !cliente || !clienteFinal || !cortes || !dataEntrada) {
      toast.error('Todos os campos devem ser preenchidos.');
      return;
    }
  
    // Remove o ponto do ID antes de enviar
    const cleanedID = id.replace(/\./g, '');
  
    try {
      const response = await axios.post('http://localhost:5000/add-pedido', {
        ...pedido,
        id: cleanedID
      });
      setPedidos((prev) => [...prev, response.data]);
      setPedido({
        id: '',
        vendedor: '',
        cliente: '',
        clienteFinal: '',
        cortes: '',
        dataEntrada: '',
      });
      toast.success('Pedido registrado com sucesso!');
    } catch (error) {
      // Exibe a mensagem de erro retornada pelo servidor
      const errorMessage = error.response?.data?.error || 'Erro ao registrar pedido.';
      toast.error(errorMessage);
    }
  };

  return (
    <div className="formPage">
      <div className="formContainer">
        <form onSubmit={handleSubmit}>
          <div className="formGroup">
            <label>
              Pedido ID:
              <input
                type="text"
                name="id"
                value={pedido.id}
                onChange={handleChange}
                maxLength="7" // Permitirá até 7 caracteres, incluindo o ponto
                required
              />
            </label>
          </div>
          <div className="formGroup">
            <label>
              Vendedor:
              <input type="text" name="vendedor" value={pedido.vendedor} onChange={handleChange} required />
            </label>
          </div>
          <div className="formGroup">
            <label>
              Cliente:
              <input type="text" name="cliente" value={pedido.cliente} onChange={handleChange} required />
            </label>
          </div>
          <div className="formGroup">
            <label>
              Cliente Final:
              <input type="text" name="clienteFinal" value={pedido.clienteFinal} onChange={handleChange} required />
            </label>
          </div>
          <div className="formGroup">
            <label>
              Cortes:
              <input type="number" name="cortes" value={pedido.cortes} onChange={handleChange} required />
            </label>
          </div>
          <div className="formGroup">
            <label>
              Data de Entrada:
              <input type="date" name="dataEntrada" value={pedido.dataEntrada} onChange={handleChange} required />
            </label>
          </div>
          <button type="submit" className="buttonForm">Adicionar Pedido</button>
        </form>
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
      <div className="tableContainer">
        <ListaPedidos pedidos={pedidos} />
      </div>
    </div>
  );
};

export default PedidoForm;

import type { Chamador } from '../../core/tipos';

// Base de dados simulada para randomização (5 endereços reais em São Paulo)
export const MOCK_CALLERS: Chamador[] = [
  {
    phone: "(11) 98765-4321",
    hasHistory: true,
    name: "Ana Paula (Esposa)",
    historyCount: 0,
    aml: { lat: -23.5472, lng: -46.6388, address: "Rua Direita", number: "120", neighborhood: "Sé", city: "São Paulo — SP", cep: "01002-020" }
  },
  {
    phone: "(11) 91234-5678",
    hasHistory: false,
    name: "",
    historyCount: 0,
    aml: { lat: -23.5615, lng: -46.6559, address: "Avenida Paulista", number: "1578", neighborhood: "Bela Vista", city: "São Paulo — SP", cep: "01310-200" }
  },
  {
    phone: "(11) 97777-8888",
    hasHistory: true,
    name: "Carlos Eduardo (Filho)",
    historyCount: 2,
    aml: { lat: -23.5874, lng: -46.6332, address: "Rua Domingos de Morais", number: "2500", neighborhood: "Vila Mariana", city: "São Paulo — SP", cep: "04036-100" }
  },
  {
    phone: "(11) 95555-4444",
    hasHistory: false,
    name: "",
    historyCount: 0,
    aml: { lat: -23.5365, lng: -46.6461, address: "Avenida Ipiranga", number: "344", neighborhood: "República", city: "São Paulo — SP", cep: "01046-010" }
  },
  {
    phone: "(11) 93333-2222",
    hasHistory: true,
    name: "Antônio Ribeiro (Paciente)",
    historyCount: 5,
    aml: { lat: -23.5505, lng: -46.6333, address: "Praça da Sé", number: "S/N", neighborhood: "Sé", city: "São Paulo — SP", cep: "01001-000" }
  },
  // Cenário de estresse: chamada SEM localização automática (telefone fixo/VoIP,
  // AML indisponível). O caminho manual — coletar endereço por voz — é o produto
  // funcionando, não uma falha; a demo precisa mostrá-lo.
  {
    phone: "(11) 3222-0000",
    hasHistory: false,
    name: "",
    historyCount: 0,
    aml: null
  }
];

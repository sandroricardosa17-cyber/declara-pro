import { Client, Declaration } from "@/types";

export const mockClients: Client[] = [
  { id: "1", name: "Maria Silva Santos", cpf: "123.456.789-00", birthDate: "1985-03-15", phone: "(11) 99999-1234", email: "maria@email.com", address: "Rua das Flores, 123 - São Paulo/SP", profession: "Engenheira", notes: "Cliente desde 2020", createdAt: "2020-01-15" },
  { id: "2", name: "João Pedro Oliveira", cpf: "987.654.321-00", birthDate: "1990-07-22", phone: "(11) 98888-5678", email: "joao@email.com", address: "Av. Paulista, 456 - São Paulo/SP", profession: "Médico", notes: "Possui investimentos", createdAt: "2021-03-10" },
  { id: "3", name: "Ana Carolina Ferreira", cpf: "456.789.123-00", birthDate: "1978-11-30", phone: "(21) 97777-9012", email: "ana@email.com", address: "Rua Copacabana, 789 - Rio de Janeiro/RJ", profession: "Advogada", notes: "Declaração complexa", createdAt: "2019-02-20" },
  { id: "4", name: "Carlos Eduardo Lima", cpf: "321.654.987-00", birthDate: "1995-01-08", phone: "(31) 96666-3456", email: "carlos@email.com", address: "Rua da Bahia, 321 - Belo Horizonte/MG", profession: "Programador", notes: "", createdAt: "2023-01-05" },
  { id: "5", name: "Fernanda Costa Souza", cpf: "654.321.987-00", birthDate: "1982-09-14", phone: "(41) 95555-7890", email: "fernanda@email.com", address: "Rua XV de Novembro, 654 - Curitiba/PR", profession: "Dentista", notes: "Tem clínica própria", createdAt: "2022-04-18" },
];

export const mockDeclarations: Declaration[] = [
  { id: "1", clientId: "1", clientName: "Maria Silva Santos", yearBase: 2024, exerciseYear: 2025, status: "finalizada", type: "completa", result: "a_restituir", resultValue: 3250.45, fee: 350, paymentStatus: "pago", paymentMethod: "pix", fiscalRisk: "baixo", malhaFina: false, sentDate: "2025-03-10" },
  { id: "2", clientId: "2", clientName: "João Pedro Oliveira", yearBase: 2024, exerciseYear: 2025, status: "em_andamento", type: "completa", fee: 500, paymentStatus: "pendente", fiscalRisk: "medio", malhaFina: false },
  { id: "3", clientId: "3", clientName: "Ana Carolina Ferreira", yearBase: 2024, exerciseYear: 2025, status: "aguardando_documentos", type: "completa", fee: 450, paymentStatus: "pendente", fiscalRisk: "alto", malhaFina: false },
  { id: "4", clientId: "4", clientName: "Carlos Eduardo Lima", yearBase: 2024, exerciseYear: 2025, status: "enviada", type: "simplificada", result: "a_pagar", resultValue: 1200, installments: 3, fee: 200, paymentStatus: "pago", paymentMethod: "cartao", fiscalRisk: "baixo", malhaFina: false, sentDate: "2025-03-15" },
  { id: "5", clientId: "5", clientName: "Fernanda Costa Souza", yearBase: 2024, exerciseYear: 2025, status: "em_revisao", type: "completa", fee: 600, paymentStatus: "parcial", paymentMethod: "transferencia", fiscalRisk: "medio", malhaFina: false },
  { id: "6", clientId: "1", clientName: "Maria Silva Santos", yearBase: 2023, exerciseYear: 2024, status: "processada", type: "completa", result: "a_restituir", resultValue: 2800, fee: 300, paymentStatus: "pago", paymentMethod: "pix", fiscalRisk: "baixo", malhaFina: false, sentDate: "2024-03-08", processedDate: "2024-06-15" },
  { id: "7", clientId: "2", clientName: "João Pedro Oliveira", yearBase: 2023, exerciseYear: 2024, status: "processada", type: "completa", result: "a_restituir", resultValue: 5400, fee: 450, paymentStatus: "pago", paymentMethod: "pix", fiscalRisk: "baixo", malhaFina: true, sentDate: "2024-03-20", processedDate: "2024-09-10" },
];

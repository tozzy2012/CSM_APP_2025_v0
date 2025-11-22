// Script para atualizar accounts existentes com campo status
const accounts = JSON.parse(localStorage.getItem('zapper_accounts') || '[]');

const statusMapping = {
  'healthy': 'Saudável',
  'at-risk': 'Atenção',
  'critical': 'Crítico'
};

const updatedAccounts = accounts.map(account => {
  if (!account.status) {
    // Mapear healthStatus para status do pipeline
    account.status = statusMapping[account.healthStatus] || 'Saudável';
  }
  return account;
});

localStorage.setItem('zapper_accounts', JSON.stringify(updatedAccounts));
console.log('Accounts atualizadas:', updatedAccounts);

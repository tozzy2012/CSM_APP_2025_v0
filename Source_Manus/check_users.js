// Script para verificar usuários no localStorage via browser automation
const users = JSON.parse(localStorage.getItem('zapper_users') || '[]');
console.log('=== USUÁRIOS NO LOCALSTORAGE ===');
console.log('Total:', users.length);
users.forEach((u, i) => {
  console.log(`\n${i+1}. ${u.name}`);
  console.log(`   Email: ${u.email}`);
  console.log(`   Senha: ${u.password}`);
  console.log(`   Role: ${u.role}`);
  console.log(`   OrgID: ${u.organizationId || 'null'}`);
});

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const p = new PrismaClient();

const ADMIN_EMAIL    = process.env.ADMIN_EMAIL    || 'admin@howlonguntilx.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'Admin@2026!';

async function main() {
  const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 12);
  const admin = await p.user.upsert({
    where: { email: ADMIN_EMAIL },
    update: { role: 'ADMIN', plan: 'PRO', name: 'Admin', emailVerified: new Date(), passwordHash },
    create: { email: ADMIN_EMAIL, name: 'Admin', role: 'ADMIN', plan: 'PRO', emailVerified: new Date(), passwordHash },
  });
  console.log('\n✅ Admin account ready:');
  console.log('   Email   :', admin.email);
  console.log('   Password: ' + ADMIN_PASSWORD);
  console.log('   Role    :', admin.role);
  console.log('   Plan    :', admin.plan);
  console.log('\n👉 Sign in at: http://localhost:3000/auth/signin\n');
  await p.$disconnect();
}
main().catch(e => { console.error(e); p.$disconnect(); process.exit(1); });

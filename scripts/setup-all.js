const { execSync } = require('child_process');

/**
 * Complete Platform Setup - Run this after starting the Hardhat node.
 * 
 * Usage: npx hardhat run scripts/setup-all.js --network localhost
 * 
 * This runs all setup steps in order:
 * 1. Deploy contracts
 * 2. Setup test roles (admin, staff1, staff2)
 * 3. Register cylinders for all branches
 * 4. Fix any missing staff roles
 */

const steps = [
  { name: 'Deploy contracts', script: 'scripts/deploy.js' },
  { name: 'Setup test roles', script: 'scripts/setup-test-roles.js' },
  { name: 'Register cylinders for all branches', script: 'scripts/register-all-cylinders.js' },
  { name: 'Fix staff roles', script: 'scripts/fix-staff-roles.js' },
];

async function main() {
  console.log('\n' + '='.repeat(60));
  console.log('🚀 COMPLETE PLATFORM SETUP');
  console.log('='.repeat(60) + '\n');

  for (let i = 0; i < steps.length; i++) {
    const step = steps[i];
    console.log(`\n${'─'.repeat(60)}`);
    console.log(`📌 Step ${i + 1}/${steps.length}: ${step.name}`);
    console.log('─'.repeat(60) + '\n');

    try {
      execSync(`npx hardhat run ${step.script} --network localhost`, {
        stdio: 'inherit',
        cwd: process.cwd(),
      });
      console.log(`\n✅ Step ${i + 1} completed!`);
    } catch (error) {
      console.error(`\n❌ Step ${i + 1} failed: ${step.name}`);
      console.error('   Fix the error and run this script again.');
      process.exit(1);
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('🎉 PLATFORM FULLY READY!');
  console.log('='.repeat(60));
  console.log('\n📋 Quick Reference:');
  console.log('   Admin:  0xf39F...2266 (Account #0)');
  console.log('   Staff1: 0x7099...79C8 (Account #1)');
  console.log('   Staff2: 0x3C44...93BC (Account #2)');
  console.log('\n   Frontend: cd frontend && npm run dev');
  console.log('\n⚠️  Keep the Hardhat node running to preserve data!');
  console.log('   If you restart the node, run this script again.\n');
}

main();

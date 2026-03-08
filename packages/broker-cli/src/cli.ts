#!/usr/bin/env node
import inquirer from 'inquirer';
import chalk from 'chalk';
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

async function main() {
  const args = process.argv.slice(2);
  const command = args[0] || 'help';

  switch (command) {
    case 'setup':
      const brokerArg = args[1];
      if (brokerArg) {
        await runSetup([brokerArg]);
      } else {
        await runSetup();
      }
      break;
    case 'list':
      runList();
      break;
    default:
      console.log(chalk.blue('\nUniversal Broker SDK CLI'));
      console.log(chalk.gray('Usage:'));
      console.log('  npx universal-broker setup    ' + chalk.dim('- Install brokers interactively'));
      console.log('  npx universal-broker list     ' + chalk.dim('- See installed brokers'));
      break;
  }
}

async function runSetup(preSelected?: string[]) {
  let brokers = preSelected;

  if (!brokers) {
    const response = await inquirer.prompt([
      {
        type: 'checkbox',
        name: 'brokers',
        message: 'Select the message brokers (Press <space> to select, <enter> to confirm):',
        choices: [
          { name: 'Kafka', value: 'kafka' },
          { name: 'Redis', value: 'redis' },
          { name: 'RabbitMQ', value: 'rabbitmq' },
          { name: 'AWS SQS', value: 'sqs' },
          { name: 'MQTT', value: 'mqtt' }
        ],
        validate: (answer) => {
          if (answer.length < 1) {
            return 'You must choose at least one broker. Hint: Use SPACE bar to select!';
          }
          return true;
        }
      }
    ]);
    brokers = response.brokers;
  }
  
  if (!brokers || brokers.length === 0) {
    console.log(chalk.yellow('No brokers selected. Nothing to install.'));
    return;
  }

  console.log(chalk.cyan('\nInstalling selected packages...'));
  
  for (const broker of brokers) {
    const pkg = `@universal-broker/${broker}`;
    console.log(chalk.gray(`Installing ${pkg}...`));
    
    try {
      // Check if we are in local development (inside the monorepo)
      const localPkgPath = path.resolve(__dirname, `../../broker-${broker}`);
      
      if (fs.existsSync(localPkgPath)) {
        console.log(chalk.yellow(`Local package found! Installing from: ${localPkgPath}`));
        execSync(`npm install ${localPkgPath}`, { stdio: 'inherit' });
      } else {
        execSync(`npm install ${pkg}`, { stdio: 'inherit' });
      }
      
      console.log(chalk.green(`Successfully installed ${pkg}`));
    } catch (err) {
      console.log(chalk.red(`Failed to install ${pkg}`));
    }
  }

  console.log(chalk.bold.green('\nSetup completed! 🚀'));
}

function runList() {
  console.log(chalk.blue('\nInstalled Universal Broker Packages:'));
  
  const pkgPath = path.join(process.cwd(), 'package.json');
  if (!fs.existsSync(pkgPath)) {
    console.log(chalk.red('No package.json found in current directory.'));
    return;
  }

  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
  const deps = { ...(pkg.dependencies || {}), ...(pkg.devDependencies || {}) };
  
  const installed = Object.keys(deps).filter(d => d.startsWith('@universal-broker/'));

  if (installed.length === 0) {
    console.log(chalk.gray('No @universal-broker packages found.'));
  } else {
    installed.forEach(name => {
      console.log(chalk.green(`- ${name} (v${deps[name]})`));
    });
  }
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});

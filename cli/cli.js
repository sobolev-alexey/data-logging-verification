#!/usr/bin/env node
const fs = require('fs');
const inquirer = require('inquirer');
const chalk = require('chalk');
const { generateKeys } = require('./encryption');
const { getConfig, callApi, validateEmail } = require('./utils');
const { startSpinner, stopSpinner } = require('./spinner');

const login = require('./login');

let configFilePath = './config.json';
let config = getConfig(configFilePath);

const mainMenuMap = new Map([
  ['Log data',  async () => {
      // const { nodeId }  = await listNodes()
      // const nodeList = await lib.list(nodeId)
      // const table = new Table({ head: ["Node Name", "NodeId (used to reference a node)"] });
      // nodeList.forEach((node, i) => {
      //   table.push([node.nodeType, node.nodeId]);
      // });
      // if(nodeList.length===0) {
      //   table.push([{colSpan: 2, content:'No child Nodes found.'}]);
      // }
      // console.log(table.toString());
      console.log('List nodes')
      showMainMenu()
    }
  ],
  ['Verify data', async (answers) => {
        // const { fnId } = await describeFunction()
        // try {
        //   const { arrayUserInputFnSignature, cmd } = await lib.describeFn(fnId)
        //   const table = new Table({ head: [{colSpan: arrayUserInputFnSignature.length, content:'Function Signature'}] });
        //   if(arrayUserInputFnSignature.length) {
        //     table.push(arrayUserInputFnSignature.map(n => `${n.name}(${n.type})`));
        //   } else {
        //     table.push(['This Function has no arguments.']);
        //   }
        //   console.log(table.toString());
        // } catch (e) {
        //   console.error(e.message)
        // }
        console.log('Show function')
        showMainMenu()
      }
   ],
  ['Verify trade', async () => {
        const { nodeId } = await inquirer.prompt([{
          type: 'input',
          name: 'nodeId',
          message: "Please Enter the nodeId of the Function to call"
        }])
        try {
          // const { arrayInputSignature, outputName, outputDesc } = await describeFn(nodeId)
          // const asnwers = await callFunction(arrayInputSignature)
          // arrayInputSignature.map(arg => arg.value = asnwers[arg.name])
          // //console.log(arrayInputSignature);
          // const { value } = await callFn(nodeId, arrayInputSignature)
          // console.log(`${outputDesc} (${chalk.green(outputName)})`);
          // if(isJson((value))) {
          //   console.log(beautify(JSON.parse(value), null, 2, 80));
          // } else {
          //   console.log(value);
          // }
          console.log('Call a Function', nodeId)
        } catch (error) {
          console.log(error.message);
        } finally {
          showMainMenu()
        }
  }],
  ['Index', async () => {
    console.clear();
    const { streamId, groupId } = await inquirer.prompt([{
      type: 'input',
      name: 'streamId',
      message: "Stream ID",
      default: config.streamId,
      validate: answer => answer ? true : 'Stream ID is empty!',
    }, {
      type: 'input',
      name: 'groupId',
      message: 'Group ID',
      default: config.groupId,
      validate: answer => answer ? true : 'Group ID is empty!',
    }])
    try {
      console.clear();
      console.log(chalk.white.bold('Retrieving data stream...'));
      startSpinner(showMainMenu);

      const result = await login(email, privateKeyFile);
      stopSpinner();

      if (result.status === 'success') {
        console.log(chalk.green.bold('\nLogin successful'));
      } else {
        result && result.error && console.error(chalk.red.bold(result.status, result.error));
      }
    } catch (error) {
      console.error(chalk.red(error.message));
    } finally {
      showMainMenu();
    }
  }],
  [new inquirer.Separator()],
  ['Login', async () => {
    console.clear();
    const { email, privateKeyFile } = await inquirer.prompt([{
      type: 'input',
      name: 'email',
      message: "Email address",
      default: config.email,
      validate: answer => {
        try {
          if (!answer) {
            return 'Email is empty!';
          }
          const valid = validateEmail(answer);
          if (!valid) {
            return 'Wrong email address';
          }
          return true;
        } catch (error) {
          return 'Wrong email address';
        }
      },
    }, {
      type: 'input',
      name: 'privateKeyFile',
      message: 'Path to JSON file with private key',
      default: config.keyFile,
      validate: answer => answer ? true : 'Path to JSON file is empty!',
    }])
    try {
      console.clear();
      console.log(chalk.white.bold('Click on the link in your email to confirm login.'));
      startSpinner(showMainMenu);

      const result = await login(email, privateKeyFile);
      stopSpinner();

      if (result.status === 'success') {
        console.log(chalk.green.bold('\nLogin successful'));
      } else {
        result && result.error && console.error(chalk.red.bold(result.status, result.error));
      }
    } catch (error) {
      console.error(chalk.red(error.message));
    } finally {
      showMainMenu();
    }
  }],
  ['Register', async () => {
    // console.clear()
     const { nodeId } = await inquirer.prompt([{
       type: 'input',
       name: 'nodeId',
       message: "Please Enter the nodeId of the Monitored item"
     }])
     try {
       if(!nodeId) {
         throw new Error("NodeId is empty!")
       }
       // lib.monitorItemReading(nodeId)
       console.log('Subscribe', nodeId)
     } catch (error) {
       console.error(chalk.red(error.message));
     } finally {
       showMainMenu()
     }
   }],
  [new inquirer.Separator()],
  ['Exit', () => {
    console.log("exiting now");
    return process.exit(0);
  }],
])


const mainMenu = [{
  type: 'rawlist',
  name: 'mainChoice',
  message: 'Please select a type of request',
  pageSize: 10,
  choices: Array.from(mainMenuMap.entries()).map(arr => arr[0])
}]

const showMainMenu = (configFile = configFilePath, questions = mainMenu) => {
  configFilePath = configFile;
  config = getConfig(configFile);

  inquirer.prompt(mainMenu).then(async answers => {
    mainMenuMap.get(answers.mainChoice)();
  });
}

showMainMenu();

module.exports = configFile => showMainMenu(configFile);
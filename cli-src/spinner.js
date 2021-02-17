const clui = require('clui');
const Spinner = clui.Spinner;

const spinner = new Spinner('...', ['⣾','⣽','⣻','⢿','⡿','⣟','⣯','⣷']);

let interval;

const startSpinner = callback => {
  spinner.start();
  
  let number = 540;
  interval = setInterval(function () {
    number--;
    spinner.message(`This operation will abort in ${number} seconds...`);
    if (number === 0) {
      spinner.stop();
      callback() || process.exit(0);
    }
  }, 1000);
}

const stopSpinner = () => {
  interval && clearInterval(interval);
  spinner.message('...');
  spinner.stop();
}

module.exports = {
  startSpinner,
  stopSpinner,
};
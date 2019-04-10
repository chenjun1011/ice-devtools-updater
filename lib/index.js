

const glob = require('glob');
const fs = require('fs');
const path = require('path');
const home = require('user-home');
const easyfile = require('easyfile');
const rm = require('rimraf').sync;
const ora = require('ora');
const chalk = require('chalk');
const download = require('./download');

module.exports = async function () {
  const cwd = process.cwd();

  // generate .template
  const templatePath = await downloadTemplate('@icedesign/ice-react-material-template');
  easyfile.copy(path.join(templatePath, 'template'), path.join(cwd, '.template'));

  update('blocks/*/package.json', cwd, 'block');
  update('components/*/package.json', cwd, 'component');

  console.log();
  console.log(chalk.green('物料仓库升级成功'));
  console.log();
};

function update(pattern, cwd, type) {
  glob(
    pattern,
    {
      cwd,
      nodir: true,
    },
    (err, files) => {
      if (err) {
        console.log('err:', err);
      } else {
        generate(files, cwd, type);
      }
    }
  );
}

function generate(files, cwd, type) {
  files.map((file) => {
    const pkgPath = path.join(cwd, file);
    const pkg = JSON.parse(fs.readFileSync(pkgPath));
    pkg.scripts.start = 'ice dev';
    pkg.scripts.build = 'ice build';

    if (type === 'block') {
      if (!pkg.devDependencies) {
        pkg.devDependencies = {};
      }
  
      if (!pkg.devDependencies['react-dom']) {
        pkg.devDependencies['react-dom'] = '^16.x';
      }
  
      if (!pkg.buildConfig) {
        pkg.buildConfig = {};
      }
  
      pkg.buildConfig.entry = 'demo/index.js';
      pkg.buildConfig.output = {
        publicPath: './'
      };
    }

    const jsonString = JSON.stringify(pkg, null, 2);
    fs.writeFileSync(pkgPath, jsonString, 'utf-8');

    if (type === 'block') {
      const dest = path.resolve(pkgPath, '..');
      const demoPath = path.join(__dirname, 'template');
      easyfile.copy(demoPath, dest);
    }
  });
}


/**
 * 从 npm 下载初始模板进行生成
 * @param {string} template  初始模板
 * @param {string} tmp       缓存路径
 * @param {string} to        写入路径
 * @param {string} name      项目名称
 */
function downloadTemplate(template) {
  const spinner = ora('downloading template');
  spinner.start();

  const tmp = path.join(home, '.ice-templates', template);
  // Remove if local template exists
  if (fs.existsSync(tmp)) rm(tmp);

  return download({ template })
    .then(async () => {
      spinner.stop();
      return tmp;
    })
    .catch((err) => {
      spinner.stop();
      console.log(err);
    });
}
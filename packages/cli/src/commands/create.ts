import { Command } from 'commander';
import { resolve } from 'path';
import { existsSync } from 'fs';
import fs from 'fs-extra';
import prompts from 'prompts';
import { execa } from 'execa';
import { logger } from '../utils/logger.js';
import { getPackageManager } from '../utils/check-version.js';
import { validateAppName, formatAppName } from '../utils/validate.js';
import { createAppFromTemplate } from '../utils/template.js';

export interface CreateOptions {
  template?: string;
  git?: boolean;
  install?: boolean;
  force?: boolean;
  author?: string;
  description?: string;
  category?: string;
}

export const createCommand = new Command('create')
  .alias('c')
  .description('创建新的 MagicTeam 应用')
  .argument('<project-name>', '项目名称')
  .option('-t, --template <template>', '使用指定模板', 'default')
  .option('--no-git', '不初始化 Git 仓库')
  .option('--no-install', '不自动安装依赖')
  .option('-f, --force', '强制覆盖已存在的目录')
  .option('--author <author>', '应用作者')
  .option('--description <description>', '应用描述')
  .option('--category <category>', '应用分类')
  .action(createApp);

async function createApp(projectName: string, options: CreateOptions): Promise<void> {
  try {
    // 验证项目名称
    const validationResult = validateAppName(projectName);
    if (!validationResult.valid) {
      logger.error(`项目名称无效: ${validationResult.message}`);
      return;
    }

    const formattedName = formatAppName(projectName);
    const targetDir = resolve(process.cwd(), formattedName);

    // 检查目录是否已存在
    if (existsSync(targetDir)) {
      if (!options.force) {
        logger.warn(`目录 ${formattedName} 已存在`);
        
        const response = await prompts({
          type: 'confirm',
          name: 'overwrite',
          message: `是否要覆盖已存在的目录？`,
          initial: false
        }, {
          onCancel: () => {
            logger.info('操作已取消');
            process.exit(0);
          }
        });

        if (!response || !response.overwrite) {
          logger.info('操作已取消');
          return;
        }
      }
      
      logger.info('正在删除已存在的目录...');
      await fs.remove(targetDir);
    }

    // 收集应用信息（在创建目录之前）
    const appInfo = await collectAppInfo(formattedName, options);

    // 开始创建项目的 spinner
    const spinner = logger.spinner('正在创建项目...');
    spinner.start();

    // 创建目录
    await fs.ensureDir(targetDir);

    // 从模板创建应用
    await createAppFromTemplate({
      templateName: options.template || 'default',
      targetDir,
      appInfo
    });

    spinner.succeed('项目目录创建完成');

    // 初始化 Git
    if (options.git) {
      await initializeGit(targetDir);
    }

    // 安装依赖
    if (options.install) {
      await installDependencies(targetDir);
    }

    // 显示成功信息
    showSuccessMessage(formattedName, options);

  } catch (error) {
    logger.error('创建应用失败');
    if (error instanceof Error) {
      logger.error(error.message);
      logger.debug('Error details:', error);
    }
    process.exit(1);
  }
}

async function collectAppInfo(appName: string, options: CreateOptions) {
  const questions: prompts.PromptObject[] = [];

  // 只有在命令行参数未提供时才添加对应的提示
  if (!options.author) {
    questions.push({
      type: 'text',
      name: 'author',
      message: '请输入应用作者:',
      initial: 'MagicTeam'
    });
  }

  if (!options.description) {
    questions.push({
      type: 'text',
      name: 'description',
      message: '请输入应用描述:',
      initial: `${appName} 应用`
    });
  }

  if (!options.category) {
    questions.push({
      type: 'select',
      name: 'category',
      message: '请选择应用分类:',
      choices: [
        { title: '工具类 (utility)', value: 'utility' },
        { title: '教育类 (education)', value: 'education' },
        { title: '通信类 (communication)', value: 'communication' },
        { title: '娱乐类 (entertainment)', value: 'entertainment' },
        { title: '效率类 (productivity)', value: 'productivity' },
        { title: '其他 (other)', value: 'other' }
      ],
      initial: 0
    });
  }

  // 如果所有参数都已通过命令行提供，直接返回
  if (questions.length === 0) {
    return {
      name: appName,
      author: options.author,
      description: options.description,
      category: options.category
    };
  }

  // 显示交互式提示收集缺失的信息
  const answers = await prompts(questions, {
    onCancel: () => {
      throw new Error('操作已取消');
    }
  });

  return {
    name: appName,
    author: options.author || answers.author || 'MagicTeam',
    description: options.description || answers.description || `${appName} 应用`,
    category: options.category || answers.category || 'utility'
  };
}

async function initializeGit(targetDir: string): Promise<void> {
  const spinner = logger.spinner('正在初始化 Git 仓库...');
  
  try {
    spinner.start();
    
    await execa('git', ['init'], { cwd: targetDir });
    await execa('git', ['add', '.'], { cwd: targetDir });
    await execa('git', ['commit', '-m', 'feat: initial commit'], { cwd: targetDir });
    
    spinner.succeed('Git 仓库初始化完成');
  } catch (error) {
    spinner.fail('Git 仓库初始化失败');
    logger.warn('请手动初始化 Git 仓库');
    logger.debug('Git init error:', error);
  }
}

async function installDependencies(targetDir: string): Promise<void> {
  const spinner = logger.spinner('正在安装依赖...');
  const packageManager = getPackageManager();
  
  try {
    spinner.start();
    
    const installCommand = packageManager === 'yarn' ? 'install' : 
                          packageManager === 'pnpm' ? 'install' : 'install';
    
    await execa(packageManager, [installCommand], { 
      cwd: targetDir,
      stdio: 'pipe'
    });
    
    spinner.succeed(`依赖安装完成 (${packageManager})`);
  } catch (error) {
    spinner.fail('依赖安装失败');
    logger.warn(`请手动运行 ${packageManager} install`);
    logger.debug('Install error:', error);
  }
}

function showSuccessMessage(appName: string, options: CreateOptions): void {
  logger.success(`🎉 应用 ${appName} 创建成功！`);
  logger.info('');
  logger.info('下一步操作:');
  logger.info(`  cd ${appName}`);
  
  if (!options.install) {
    const packageManager = getPackageManager();
    logger.info(`  ${packageManager} install`);
  }
  
  logger.info('  magicteam dev          # 启动集成开发服务器');
  logger.info('  magicteam dev:standalone # 启动独立开发模式');
  logger.info('  magicteam build        # 构建应用');
  logger.info('');
  logger.info('更多信息请查看 README.md');
}
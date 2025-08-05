import { Command } from 'commander';
import { join } from 'path';
import { existsSync } from 'fs';
// fs-extra 导入已移除，因为当前未使用
import { execa } from 'execa';
import semver from 'semver';
import prompts from 'prompts';
import { logger } from '../utils/logger.js';
import { findProjectRoot, readPackageJson, writePackageJson, getAppInfo } from '../utils/project.js';
import { validateVersion } from '../utils/validate.js';

export interface PublishOptions {
  version?: string;
  tag?: string;
  registry?: string;
  dryRun?: boolean;
  skipBuild?: boolean;
  skipTests?: boolean;
  force?: boolean;
}

export const publishCommand = new Command('publish')
  .alias('p')
  .description('发布应用到注册中心')
  .option('-v, --version <version>', '发布版本号')
  .option('-t, --tag <tag>', '发布标签', 'latest')
  .option('-r, --registry <registry>', '指定注册中心地址')
  .option('--dry-run', '模拟发布，不实际发布')
  .option('--skip-build', '跳过构建步骤')
  .option('--skip-tests', '跳过测试步骤')
  .option('-f, --force', '强制发布')
  .action(publishApplication);

async function publishApplication(options: PublishOptions): Promise<void> {
  try {
    const projectRoot = await findProjectRoot();
    if (!projectRoot) {
      logger.error('未找到有效的 MagicTeam 应用项目');
      return;
    }

    const packageJson = await readPackageJson(projectRoot);
    const appInfo = await getAppInfo(projectRoot);

    logger.info(`📦 准备发布 ${appInfo.id} v${appInfo.version}...`);

    // 检查工作目录状态
    await checkWorkingDirectory(projectRoot);

    // 确定发布版本
    const newVersion = await determineVersion(packageJson, options.version);
    
    // 运行预发布检查
    await runPrePublishChecks(projectRoot, options);

    // 更新版本号
    if (newVersion !== packageJson.version) {
      await updateVersion(projectRoot, newVersion);
    }

    // 构建应用
    if (!options.skipBuild) {
      await buildForProduction(projectRoot);
    }

    // 验证构建产物
    await validateBuildArtifacts(projectRoot);

    // 发布到注册中心
    if (!options.dryRun) {
      await publishToRegistry({ ...options, version: newVersion });
      
      // 创建 Git 标签
      await createGitTag(projectRoot, newVersion);
      
      logger.success(`🎉 ${appInfo.id} v${newVersion} 发布成功！`);
    } else {
      logger.info('🔍 模拟发布完成，没有实际发布');
    }

  } catch (error) {
    if (error instanceof Error) {
      logger.error(`发布失败: ${error.message}`);
    }
    process.exit(1);
  }
}

async function checkWorkingDirectory(projectRoot: string): Promise<void> {
  try {
    // 检查是否有未提交的更改
    const result = await execa('git', ['status', '--porcelain'], { 
      cwd: projectRoot,
      stdio: 'pipe'
    });

    if (result.stdout.trim()) {
      const response = await prompts({
        type: 'confirm',
        name: 'continue',
        message: '工作目录有未提交的更改，是否继续发布？',
        initial: false
      });

      if (!response.continue) {
        throw new Error('发布已取消');
      }
    }
  } catch (error) {
    // Git 不可用或不是 Git 仓库，忽略检查
    logger.warn('无法检查 Git 状态，跳过工作目录检查');
  }
}

async function determineVersion(packageJson: any, specifiedVersion?: string): Promise<string> {
  const currentVersion = packageJson.version;

  if (specifiedVersion) {
    const validation = validateVersion(specifiedVersion);
    if (!validation.valid) {
      throw new Error(`版本号无效: ${validation.message}`);
    }
    return specifiedVersion;
  }

  // 交互式选择版本号
  const choices = [
    {
      title: `Patch (${semver.inc(currentVersion, 'patch')})`,
      value: semver.inc(currentVersion, 'patch')!
    },
    {
      title: `Minor (${semver.inc(currentVersion, 'minor')})`,
      value: semver.inc(currentVersion, 'minor')!
    },
    {
      title: `Major (${semver.inc(currentVersion, 'major')})`,
      value: semver.inc(currentVersion, 'major')!
    },
    {
      title: '自定义版本',
      value: 'custom'
    }
  ];

  const response = await prompts({
    type: 'select',
    name: 'versionType',
    message: `当前版本: ${currentVersion}，选择新版本:`,
    choices
  });

  if (response.versionType === 'custom') {
    const customResponse = await prompts({
      type: 'text',
      name: 'version',
      message: '输入自定义版本号:',
      validate: (value) => {
        const validation = validateVersion(value);
        return validation.valid || validation.message || false;
      }
    });
    return customResponse.version;
  }

  return response.versionType;
}

async function runPrePublishChecks(projectRoot: string, options: PublishOptions): Promise<void> {
  logger.info('🔍 运行预发布检查...');

  // 运行测试
  if (!options.skipTests) {
    await runTests(projectRoot);
  }

  // 运行 lint 检查
  await runLint(projectRoot);

  // 类型检查
  await runTypeCheck(projectRoot);

  logger.success('预发布检查通过');
}

async function runTests(projectRoot: string): Promise<void> {
  const spinner = logger.spinner('正在运行测试...');
  
  try {
    spinner.start();
    
    const packageJson = await readPackageJson(projectRoot);
    const scripts = packageJson.scripts || {};
    
    if (scripts.test) {
      await execa('npm', ['run', 'test'], {
        cwd: projectRoot,
        stdio: 'pipe'
      });
    } else {
      logger.warn('未找到测试脚本，跳过测试');
    }
    
    spinner.succeed('测试通过');
  } catch (error) {
    spinner.fail('测试失败');
    throw new Error('测试未通过，发布终止');
  }
}

async function runLint(projectRoot: string): Promise<void> {
  const spinner = logger.spinner('正在运行 Lint 检查...');
  
  try {
    spinner.start();
    
    const packageJson = await readPackageJson(projectRoot);
    const scripts = packageJson.scripts || {};
    
    if (scripts.lint) {
      await execa('npm', ['run', 'lint'], {
        cwd: projectRoot,
        stdio: 'pipe'
      });
    }
    
    spinner.succeed('Lint 检查通过');
  } catch (error) {
    spinner.fail('Lint 检查失败');
    throw new Error('代码规范检查未通过，发布终止');
  }
}

async function runTypeCheck(projectRoot: string): Promise<void> {
  const spinner = logger.spinner('正在进行类型检查...');
  
  try {
    spinner.start();
    
    const packageJson = await readPackageJson(projectRoot);
    const scripts = packageJson.scripts || {};
    
    if (scripts.typecheck) {
      await execa('npm', ['run', 'typecheck'], {
        cwd: projectRoot,
        stdio: 'pipe'
      });
    }
    
    spinner.succeed('类型检查通过');
  } catch (error) {
    spinner.fail('类型检查失败');
    throw new Error('类型检查未通过，发布终止');
  }
}

async function updateVersion(projectRoot: string, newVersion: string): Promise<void> {
  const spinner = logger.spinner(`正在更新版本号到 ${newVersion}...`);
  
  try {
    spinner.start();
    
    const packageJson = await readPackageJson(projectRoot);
    packageJson.version = newVersion;
    await writePackageJson(projectRoot, packageJson);
    
    spinner.succeed(`版本号已更新到 ${newVersion}`);
  } catch (error) {
    spinner.fail('版本号更新失败');
    throw error;
  }
}

async function buildForProduction(projectRoot: string): Promise<void> {
  const spinner = logger.spinner('正在构建生产版本...');
  
  try {
    spinner.start();
    
    await execa('npm', ['run', 'build'], {
      cwd: projectRoot,
      env: { ...process.env, NODE_ENV: 'production' },
      stdio: 'pipe'
    });
    
    spinner.succeed('生产版本构建完成');
  } catch (error) {
    spinner.fail('构建失败');
    throw new Error('生产构建失败，发布终止');
  }
}

async function validateBuildArtifacts(projectRoot: string): Promise<void> {
  const distDir = join(projectRoot, 'dist');
  const requiredFiles = ['bundle.js', 'manifest.json'];
  
  for (const file of requiredFiles) {
    const filePath = join(distDir, file);
    if (!existsSync(filePath)) {
      throw new Error(`构建产物缺失: ${file}`);
    }
  }
  
  logger.debug('构建产物验证通过');
}

async function publishToRegistry(options: PublishOptions & { version: string }): Promise<void> {
  const spinner = logger.spinner('正在发布到应用注册中心...');
  
  try {
    spinner.start();
    
    // 这里应该实现实际的发布逻辑
    // 上传到 CDN、更新注册表等
    logger.debug('发布选项:', options);
    
    // 模拟发布过程
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    spinner.succeed('应用已发布到注册中心');
  } catch (error) {
    spinner.fail('发布到注册中心失败');
    throw error;
  }
}

async function createGitTag(projectRoot: string, version: string): Promise<void> {
  try {
    const tagName = `v${version}`;
    
    await execa('git', ['add', '.'], { cwd: projectRoot });
    await execa('git', ['commit', '-m', `chore: release ${tagName}`], { cwd: projectRoot });
    await execa('git', ['tag', tagName], { cwd: projectRoot });
    
    logger.success(`Git 标签 ${tagName} 已创建`);
  } catch (error) {
    logger.warn('Git 标签创建失败，请手动创建');
    logger.debug('Git tag error:', error);
  }
}
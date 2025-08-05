export interface ValidationResult {
  valid: boolean;
  message?: string;
}

const RESERVED_NAMES = [
  'test', 'react', 'node_modules', 'favicon.ico', 'public', 'private',
  'magicteam', 'core', 'app', 'src', 'dist', 'build', 'bin', 'lib'
];

const INVALID_CHARS = /[<>:"/\\|?*\x00-\x1f]/;
const VALID_APP_NAME = /^[a-z][a-z0-9]*(-[a-z0-9]+)*$/;

export function validateAppName(name: string): ValidationResult {
  // 检查是否为空
  if (!name || name.trim().length === 0) {
    return {
      valid: false,
      message: '应用名称不能为空'
    };
  }

  const trimmedName = name.trim();

  // 检查长度
  if (trimmedName.length < 2) {
    return {
      valid: false,
      message: '应用名称至少需要 2 个字符'
    };
  }

  if (trimmedName.length > 50) {
    return {
      valid: false,
      message: '应用名称不能超过 50 个字符'
    };
  }

  // 检查保留名称
  if (RESERVED_NAMES.includes(trimmedName.toLowerCase())) {
    return {
      valid: false,
      message: `"${trimmedName}" 是保留名称，请使用其他名称`
    };
  }

  // 检查非法字符
  if (INVALID_CHARS.test(trimmedName)) {
    return {
      valid: false,
      message: '应用名称包含非法字符'
    };
  }

  // 检查格式
  if (!VALID_APP_NAME.test(trimmedName)) {
    return {
      valid: false,
      message: '应用名称必须以小写字母开头，只能包含小写字母、数字和连字符'
    };
  }

  // 检查是否以连字符开头或结尾
  if (trimmedName.startsWith('-') || trimmedName.endsWith('-')) {
    return {
      valid: false,
      message: '应用名称不能以连字符开头或结尾'
    };
  }

  // 检查连续连字符
  if (trimmedName.includes('--')) {
    return {
      valid: false,
      message: '应用名称不能包含连续的连字符'
    };
  }

  return { valid: true };
}

export function formatAppName(name: string): string {
  return name.trim().toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/--+/g, '-');
}

export function validatePackageName(name: string): ValidationResult {
  const packageName = `@magicteam/app-${name}`;
  
  // npm 包名验证规则
  if (packageName.length > 214) {
    return {
      valid: false,
      message: '包名过长'
    };
  }

  if (packageName.startsWith('.') || packageName.startsWith('_')) {
    return {
      valid: false,
      message: '包名不能以点或下划线开头'
    };
  }

  return { valid: true };
}

export function validateVersion(version: string): ValidationResult {
  const semverRegex = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-((?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*)(?:\.(?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*))*))?(?:\+([0-9a-zA-Z-]+(?:\.[0-9a-zA-Z-]+)*))?$/;
  
  if (!semverRegex.test(version)) {
    return {
      valid: false,
      message: '版本号必须符合语义化版本规范 (SemVer)'
    };
  }

  return { valid: true };
}

export function validateEmail(email: string): ValidationResult {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  
  if (!emailRegex.test(email)) {
    return {
      valid: false,
      message: '请输入有效的邮箱地址'
    };
  }

  return { valid: true };
}

export function validateUrl(url: string): ValidationResult {
  try {
    new URL(url);
    return { valid: true };
  } catch {
    return {
      valid: false,
      message: '请输入有效的 URL'
    };
  }
}
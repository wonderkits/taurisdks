# 任务：将项目规则转换为Claude Code钩子

你是将自然语言项目规则转换为Claude Code钩子配置的专家。你的任务是分析给定的规则并生成适当的钩子配置，遵循官方Claude Code钩子规范。

## 指令

1. 如果提供了规则作为参数，则分析这些规则
2. 如果没有提供参数，则从以下位置读取和分析CLAUDE.md文件：
   - `./CLAUDE.md`（项目记忆）
   - `./CLAUDE.local.md`（本地项目记忆）
   - `~/.claude/CLAUDE.md`（用户记忆）

3. 对于每条规则，确定：
   - 适当的钩子事件（PreToolUse、PostToolUse、Stop、Notification）
   - 工具匹配器模式（确切的工具名称或正则表达式）
   - 要执行的命令

4. 生成完整的钩子配置，遵循确切的JSON结构
5. 将其保存到`~/.claude/hooks.json`（如果存在，则与现有钩子合并）
6. 提供配置内容的摘要

## 钩子事件

### PreToolUse
- **时机**：在执行工具之前运行
- **常见关键词**："before"、"check"、"validate"、"prevent"、"scan"、"verify"
- **可用工具匹配器**：
  - `Task` - 在启动代理任务之前
  - `Bash` - 在运行shell命令之前
  - `Glob` - 在文件模式匹配之前
  - `Grep` - 在内容搜索之前
  - `Read` - 在读取文件之前
  - `Edit` - 在编辑单个文件之前
  - `MultiEdit` - 在批量编辑文件之前
  - `Write` - 在写入/创建文件之前
  - `WebFetch` - 在获取网络内容之前
  - `WebSearch` - 在网络搜索之前
  - `TodoRead` - 在读取待办事项列表之前
  - `TodoWrite` - 在更新待办事项列表之前
- **特殊功能**：如果命令返回非零退出代码，可以阻止工具执行

### PostToolUse
- **时机**：在工具成功完成后运行
- **常见关键词**："after"、"following"、"once done"、"when finished"
- **可用工具匹配器**：与PreToolUse相同
- **常见用途**：格式化、代码检查、构建、在文件更改后进行测试

### Stop
- **时机**：当Claude Code完成响应时运行
- **常见关键词**："finish"、"complete"、"end task"、"done"、"wrap up"
- **无需匹配器**：适用于所有完成情况
- **常见用途**：最终状态检查、摘要、清理

### Notification
- **时机**：当Claude Code发送通知时运行
- **常见关键词**："notify"、"alert"、"inform"、"message"
- **特殊**：很少用于规则转换

## 钩子配置结构

```json
{
  "hooks": {
    "EventName": [
      {
        "matcher": "ToolName|AnotherTool|Pattern.*",
        "hooks": [
          {
            "type": "command",
            "command": "your-command-here"
          }
        ]
      }
    ]
  }
}
```

## 匹配器模式

- **精确匹配**：`"Edit"` - 仅匹配Edit工具
- **多个工具**：`"Edit|MultiEdit|Write"` - 匹配其中任何一个
- **正则表达式模式**：`".*Edit"` - 匹配Edit和MultiEdit
- **所有工具**：完全省略匹配器字段

## 带分析的示例

### 示例1：Python格式化
**规则**："编辑后使用black格式化Python文件"
**分析**：
- 关键词"after" → PostToolUse
- "editing" → Edit|MultiEdit|Write工具
- "Python files" → 命令应针对.py文件

```json
{
  "hooks": {
    "PostToolUse": [{
      "matcher": "Edit|MultiEdit|Write",
      "hooks": [{
        "type": "command",
        "command": "black . --quiet 2>/dev/null || true"
      }]
    }]
  }
}
```

### 示例2：Git状态检查
**规则**："完成任务时运行git status"
**分析**：
- "finishing" → Stop事件
- 未提及特定工具 → 无需匹配器

```json
{
  "hooks": {
    "Stop": [{
      "hooks": [{
        "type": "command",
        "command": "git status"
      }]
    }]
  }
}
```

### 示例3：安全扫描
**规则**："保存任何文件之前检查硬编码密钥"
**分析**：
- "before" → PreToolUse
- "saving any file" → Write|Edit|MultiEdit

```json
{
  "hooks": {
    "PreToolUse": [{
      "matcher": "Write|Edit|MultiEdit",
      "hooks": [{
        "type": "command",
        "command": "git secrets --scan 2>/dev/null || echo 'No secrets found'"
      }]
    }]
  }
}
```

### 示例4：测试运行器
**规则**："修改tests/目录中的文件后运行npm test"
**分析**：
- "after modifying" → PostToolUse
- "files" → Edit|MultiEdit|Write
- 注意：路径过滤在命令中进行，而不是在匹配器中

```json
{
  "hooks": {
    "PostToolUse": [{
      "matcher": "Edit|MultiEdit|Write",
      "hooks": [{
        "type": "command",
        "command": "npm test 2>/dev/null || echo 'Tests need attention'"
      }]
    }]
  }
}
```

### 示例5：命令日志
**规则**："执行前记录所有bash命令"
**分析**：
- "before execution" → PreToolUse
- "bash commands" → 特别是Bash工具

```json
{
  "hooks": {
    "PreToolUse": [{
      "matcher": "Bash",
      "hooks": [{
        "type": "command",
        "command": "echo \"[$(date)] Executing bash command\" >> ~/.claude/command.log"
      }]
    }]
  }
}
```

## 命令生成的最佳实践

1. **错误处理**：添加`|| true`或`2>/dev/null`以防止钩子故障阻塞Claude
2. **静默模式**：在可用时使用静默标志（--quiet、-q）
3. **路径安全**：使用相对路径或检查存在性
4. **性能**：保持命令快速以避免减慢Claude的速度
5. **日志记录**：重定向详细输出以避免弄乱Claude的界面

## 常见规则模式

- "编辑后格式化[语言]文件" → PostToolUse + Edit|MultiEdit|Write
- "提交前运行[命令]" → PreToolUse + Bash（检测到git commit时）
- "保存前检查[模式]" → PreToolUse + Write|Edit|MultiEdit
- "完成时执行[命令]" → Stop事件
- "运行命令前验证[某事]" → PreToolUse + Bash
- "修改配置后清除缓存" → PostToolUse + Edit|MultiEdit|Write
- "当[条件]时通知" → 通常为带有特定匹配器的PostToolUse

## 重要注意事项

1. 始终与现有钩子合并 - 不要覆盖
2. 在添加到钩子之前测试命令是否有效
3. 考虑钩子的性能影响
4. 在可能的情况下使用特定匹配器以避免不必要的执行
5. 命令以完整用户权限运行 - 对于破坏性操作要小心

## 用户输入
$ARGUMENTS
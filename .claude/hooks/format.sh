#!/bin/bash

# Claude Code 格式化 Hook
# 在编辑文件后自动根据文件类型和项目配置选择合适的格式化工具

set -e

# 获取传入的参数
HOOK_TYPE="$1"
FILE_PATH="$2"
TOOL_NAME="$3"

# 只在编辑文件后执行格式化
if [[ "$HOOK_TYPE" != "PostToolUse" ]] || [[ "$TOOL_NAME" != "Edit" && "$TOOL_NAME" != "MultiEdit" && "$TOOL_NAME" != "Write" ]]; then
    exit 0
fi

# 如果没有文件路径，退出
if [[ -z "$FILE_PATH" ]]; then
    exit 0
fi

# 确保文件存在
if [[ ! -f "$FILE_PATH" ]]; then
    exit 0
fi

# 获取文件扩展名
EXTENSION="${FILE_PATH##*.}"
FILENAME=$(basename "$FILE_PATH")

# 获取项目根目录 (包含 package.json 的目录)
PROJECT_ROOT="$PWD"
while [[ "$PROJECT_ROOT" != "/" ]] && [[ ! -f "$PROJECT_ROOT/package.json" ]]; do
    PROJECT_ROOT=$(dirname "$PROJECT_ROOT")
done

# 如果找不到 package.json，使用当前目录
if [[ ! -f "$PROJECT_ROOT/package.json" ]]; then
    PROJECT_ROOT="$PWD"
fi

# 格式化函数
format_file() {
    local file="$1"
    local formatter="$2"
    local config_file="$3"
    
    echo "🎨 使用 $formatter 格式化: $(basename "$file")"
    
    case "$formatter" in
        "prettier")
            if [[ -n "$config_file" && -f "$config_file" ]]; then
                npx prettier --write --config "$config_file" "$file" 2>/dev/null
            else
                npx prettier --write "$file" 2>/dev/null
            fi
            ;;
        "eslint")
            if [[ -n "$config_file" && -f "$config_file" ]]; then
                npx eslint --fix --config "$config_file" "$file" 2>/dev/null
            else
                npx eslint --fix "$file" 2>/dev/null
            fi
            ;;
        "biome")
            npx @biomejs/biome format --write "$file" 2>/dev/null
            ;;
        "dprint")
            npx dprint fmt "$file" 2>/dev/null
            ;;
    esac
}

# 检测格式化工具和配置
detect_formatter() {
    local file_path="$1"
    local extension="$2"
    
    # 检查是否有 biome.json
    if [[ -f "$PROJECT_ROOT/biome.json" ]]; then
        echo "biome"
        return
    fi
    
    # 检查是否有 dprint 配置
    if [[ -f "$PROJECT_ROOT/dprint.json" ]]; then
        echo "dprint"
        return
    fi
    
    # 根据文件类型选择格式化工具
    case "$extension" in
        "ts"|"tsx"|"js"|"jsx"|"json"|"yaml"|"yml"|"md"|"html"|"css"|"scss"|"less")
            # TypeScript/JavaScript 文件优先使用 eslint + prettier
            if [[ -f "$PROJECT_ROOT/.eslintrc.json" ]] || [[ -f "$PROJECT_ROOT/.eslintrc.js" ]] || [[ -f "$PROJECT_ROOT/.eslintrc" ]]; then
                if [[ -f "$PROJECT_ROOT/.prettierrc" ]] || [[ -f "$PROJECT_ROOT/.prettierrc.json" ]] || [[ -f "$PROJECT_ROOT/.prettierrc.js" ]]; then
                    echo "eslint+prettier"
                else
                    echo "eslint"
                fi
            elif [[ -f "$PROJECT_ROOT/.prettierrc" ]] || [[ -f "$PROJECT_ROOT/.prettierrc.json" ]] || [[ -f "$PROJECT_ROOT/.prettierrc.js" ]]; then
                echo "prettier"
            fi
            ;;
        "rs")
            # Rust 文件
            if command -v rustfmt >/dev/null 2>&1; then
                echo "rustfmt"
            fi
            ;;
        "go")
            # Go 文件
            if command -v gofmt >/dev/null 2>&1; then
                echo "gofmt"
            fi
            ;;
        "py")
            # Python 文件
            if command -v black >/dev/null 2>&1; then
                echo "black"
            elif command -v autopep8 >/dev/null 2>&1; then
                echo "autopep8"
            fi
            ;;
        "java")
            # Java 文件
            if command -v google-java-format >/dev/null 2>&1; then
                echo "google-java-format"
            fi
            ;;
    esac
}

# 查找配置文件
find_config() {
    local formatter="$1"
    local dir="$2"
    
    case "$formatter" in
        "prettier")
            for config in ".prettierrc" ".prettierrc.json" ".prettierrc.js" "prettier.config.js"; do
                if [[ -f "$dir/$config" ]]; then
                    echo "$dir/$config"
                    return
                fi
            done
            ;;
        "eslint")
            for config in ".eslintrc.json" ".eslintrc.js" ".eslintrc" "eslint.config.js"; do
                if [[ -f "$dir/$config" ]]; then
                    echo "$dir/$config"
                    return
                fi
            done
            ;;
        "biome")
            if [[ -f "$dir/biome.json" ]]; then
                echo "$dir/biome.json"
            fi
            ;;
        "dprint")
            if [[ -f "$dir/dprint.json" ]]; then
                echo "$dir/dprint.json"
            fi
            ;;
    esac
}

# 执行格式化
main() {
    # 检测格式化工具
    FORMATTER=$(detect_formatter "$FILE_PATH" "$EXTENSION")
    
    if [[ -z "$FORMATTER" ]]; then
        # echo "⚠️  未找到适用于 .$EXTENSION 文件的格式化工具"
        exit 0
    fi
    
    # 查找配置文件
    CONFIG_FILE=$(find_config "$FORMATTER" "$PROJECT_ROOT")
    
    # 根据检测到的格式化工具执行格式化
    case "$FORMATTER" in
        "eslint+prettier")
            # 先运行 ESLint 修复，再运行 Prettier 格式化
            format_file "$FILE_PATH" "eslint" "$(find_config "eslint" "$PROJECT_ROOT")"
            format_file "$FILE_PATH" "prettier" "$(find_config "prettier" "$PROJECT_ROOT")"
            ;;
        "eslint"|"prettier"|"biome"|"dprint")
            format_file "$FILE_PATH" "$FORMATTER" "$CONFIG_FILE"
            ;;
        "rustfmt")
            echo "🎨 使用 rustfmt 格式化: $(basename "$FILE_PATH")"
            rustfmt "$FILE_PATH" 2>/dev/null
            ;;
        "gofmt")
            echo "🎨 使用 gofmt 格式化: $(basename "$FILE_PATH")"
            gofmt -w "$FILE_PATH" 2>/dev/null
            ;;
        "black")
            echo "🎨 使用 black 格式化: $(basename "$FILE_PATH")"
            black "$FILE_PATH" 2>/dev/null
            ;;
        "autopep8")
            echo "🎨 使用 autopep8 格式化: $(basename "$FILE_PATH")"
            autopep8 --in-place "$FILE_PATH" 2>/dev/null
            ;;
        "google-java-format")
            echo "🎨 使用 google-java-format 格式化: $(basename "$FILE_PATH")"
            google-java-format --replace "$FILE_PATH" 2>/dev/null
            ;;
    esac
}

# 执行主函数
main
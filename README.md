# SplitJoin for VSCode

Provides functionality inspired by the Neovim `mini.splitjoin` plugin, allowing you to easily split arguments onto multiple lines or join them back onto a single line.

## Features

*   **Toggle Arguments**: Intelligently splits arguments to multiple lines if they are currently on a single line, or joins them to a single line if they are already split across multiple lines.
*   **Split Arguments**: Explicitly splits arguments within the detected brackets onto separate, indented lines.
*   **Join Arguments**: Explicitly joins arguments currently on multiple lines within the detected brackets onto a single line.

## How to Use

This extension provides the following commands, which can be accessed via the VS Code Command Palette (usually `Ctrl+Shift+P` or `Cmd+Shift+P`):

*   `SplitJoin: Toggle Arguments`
    *   Command ID: `splitjoin-vscode.toggle`
*   `SplitJoin: Split Arguments`
    *   Command ID: `splitjoin-vscode.split`
*   `SplitJoin: Join Arguments`
    *   Command ID: `splitjoin-vscode.join`

Place your cursor within or near the arguments you wish to modify and run the desired command.

## Supported Syntax

*   **Brackets**: The extension currently recognizes arguments within `()`, `[]`, and `{}`.
*   **Argument Separator**: The primary argument separator is assumed to be a comma (`,`). The parser attempts to correctly handle nested structures and strings containing commas.

## Future Considerations

*   Customizable keybindings.
*   Configuration options for bracket types and separators.
*   More advanced handling for comments and complex language constructs.

## Known Issues

*   Please report any issues encountered on the project's repository (if applicable).
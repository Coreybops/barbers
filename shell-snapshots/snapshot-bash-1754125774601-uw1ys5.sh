# Snapshot file
# Unset all aliases to avoid conflicts with functions
unalias -a 2>/dev/null || true
shopt -s expand_aliases
# Check for rg availability
if ! command -v rg >/dev/null 2>&1; then
  alias rg=''\''C:\Users\andij\AppData\Roaming\npm\node_modules\@anthropic-ai\claude-code\vendor\ripgrep\x64-win32\rg.exe'\'''
fi
export PATH='/mingw64/bin:/usr/bin:/c/Users/andij/bin:/c/Users/andij/bin:/mingw64/bin:/usr/local/bin:/usr/bin:/usr/bin:/mingw64/bin:/usr/bin:/c/Users/andij/bin:/c/WINDOWS/system32:/c/WINDOWS:/c/WINDOWS/System32/Wbem:/c/WINDOWS/System32/WindowsPowerShell/v1.0:/c/WINDOWS/System32/OpenSSH:/cmd:/c/Program Files/nodejs:/c/Users/andij/AppData/Local/Programs/Python/Python312/Scripts:/c/Users/andij/AppData/Local/Programs/Python/Python312:/c/Users/andij/AppData/Local/Programs/Python/Launcher:/c/Users/andij/AppData/Local/Microsoft/WindowsApps:/c/Users/andij/AppData/Local/Programs/Microsoft VS Code/bin:/c/Users/andij/AppData/Local/GitHubDesktop/bin:/c/Users/andij/AppData/Roaming/npm:/usr/bin/vendor_perl:/usr/bin/core_perl'

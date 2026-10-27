# Windows x64 Build Commands

Run these commands in PowerShell. Install native tools once; repeat the build
section whenever you need a Windows installer.

## 1. Install Workspace Dependencies

Node.js must be version 24.13.1 or a newer Node 24 release. This repository uses
pnpm catalogs, so do not run `npm install` in the workspace.

```powershell
Set-Location "$HOME\Documents\learning\t3"
node --version
npm install --global pnpm@11.10.0
pnpm --version
pnpm install --frozen-lockfile
```

## 2. Install Rust and Refresh PATH

```powershell
winget install --id Rustlang.Rustup -e --accept-source-agreements --accept-package-agreements
$env:Path = "$env:USERPROFILE\.cargo\bin;$env:Path"
rustup --version
cargo --version
rustup target add x86_64-pc-windows-msvc
rustup target list --installed
```

If winget reports Rustup is installed but its executable is missing, use this
optional repair block instead, then repeat the Rust verification commands above:

```powershell
winget uninstall --id Rustlang.Rustup -e
winget install --id Rustlang.Rustup -e --accept-source-agreements --accept-package-agreements
$env:Path = "$env:USERPROFILE\.cargo\bin;$env:Path"
rustup target add x86_64-pc-windows-msvc
```

Fully exit and reopen VS Code after installing Rust so future terminals inherit
the updated PATH. The PATH command above updates only the current terminal.

## 3. Install Missing Spectre Libraries

Open a separate PowerShell window using **Run as administrator**. The build on
this machine selects Visual Studio Community 2026 with MSVC 14.51. These commands
add its missing x64/x86 Spectre libraries and wait for installation to finish.
They assume the existing C++ tools and Windows SDK are installed.

```powershell
$installer = "${env:ProgramFiles(x86)}\Microsoft Visual Studio\Installer\setup.exe"
$arguments = 'modify --installPath "C:\Program Files\Microsoft Visual Studio\18\Community" --add Microsoft.VisualStudio.Component.VC.14.51.x86.x64.Spectre --passive --norestart'
$process = Start-Process -FilePath $installer -ArgumentList $arguments -Wait -PassThru
if ($process.ExitCode -notin @(0, 3010)) {
    throw "Visual Studio installation failed with exit code $($process.ExitCode)"
}
if ($process.ExitCode -eq 3010) {
    Write-Output "Restart Windows before building."
}
Test-Path 'C:\Program Files\Microsoft Visual Studio\18\Community\VC\Tools\MSVC\14.51.36231\lib\spectre\x64'
```

The final check should return `True`. Exit code `5007` means the installer was
not started from an administrator PowerShell window. For a different Visual
Studio installation or toolset, use the matching path and Spectre component.
See [Windows installer prerequisites](development.md#windows-installer-prerequisites)
for the complete native-tool requirements, including Python 3.

## 4. Build the Windows Installer

Return to a normal PowerShell terminal. Refresh PATH in this terminal before
building, even if Rust was installed from a different window.

```powershell
Set-Location "$HOME\Documents\learning\t3"
$env:Path = "$env:USERPROFILE\.cargo\bin;$env:Path"
cargo --version
rustup target list --installed
pnpm run dist:desktop:win:x64
```

If the application bundles are already built and only packaging needs retrying:

```powershell
node scripts/build-desktop-artifact.ts --platform win --target nsis --arch x64 --skip-build
```

Keep `node-pty` pinned to `1.2.0-beta.15` in the server manifest: its workspace
patch targets that exact version. Do not remove the patch to bypass an unused
patch error.
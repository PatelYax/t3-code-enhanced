# Windows x64 Build Commands

Run these commands in PowerShell. Install native tools once; repeat the build
section whenever you need a Windows installer.

## 1. Install Workspace Dependencies

Node.js must be version 26.12.1. This repository uses
pnpm catalogs, so do not run `npm install` in the workspace.

```powershell
Set-Location "$HOME\Documents\learning\t3"
node --version
npm install --global pnpm@12.14.0
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

Windows installers include native Codex 0.164.0 and Node 24.15.0 runtimes. Users
do not need Node, npm, WinGet, or a separate Codex installation. Node is installed
privately with the app and added to the local server's PATH; it does not replace
or register a system-wide Node installation. npm is not included.

For an installer that is ready to use Azure OpenAI, create a private JSON file
outside the repository, such as `$HOME\.atqor-azure.json`, with this structure:

```json
{
  "endpoint": "https://YOUR-RESOURCE.openai.azure.com/openai/v1",
  "deployment": "YOUR-AZURE-DEPLOYMENT-NAME",
  "apiKey": "YOUR-AZURE-OPENAI-API-KEY"
}
```

Use the Azure deployment name, and choose a deployment supporting the Responses
API. An HTTPS Azure resource root is also accepted; the build adds `/openai/v1`
automatically. Enter the actual key directly in your local editor, not in chat or shell
history. The profile is intentionally included in the distributed installer and
is recoverable by recipients. Do not commit the profile or publish the installer
to an unintended audience.

Set its path in the build terminal before running the build:

```powershell
$env:ATQOR_AZURE_PROFILE_PATH = "$HOME\.atqor-azure.json"
```

If the variable is omitted, the installer still bundles Codex and Node but does
not configure Azure credentials. The build downloads and checksum-verifies the
pinned Windows runtimes, so the build machine needs internet access.

On first Windows-native startup, the app provisions the default Codex provider,
an app-owned Codex home, and default model selections. After a rebuild with a
changed bundled profile, installing the new app and restarting it refreshes the
installer-managed Codex key, endpoint, and model without deleting chat history.
This also upgrades profiles provisioned by older installers. Custom providers
are left unchanged. An unchanged bundled profile preserves local edits; a
changed profile replaces the app-owned Codex config. To change the installed key
locally, edit the provider instance's sensitive `AZURE_OPENAI_API_KEY` (Azure)
or `OPENAI_API_KEY` (OpenAI proxy) environment variable in Settings > Providers.
Configuration is local to this Windows environment; WSL
and remote environments need their own setup. Internet access to Azure remains
required on the user's machine.

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
pnpm run dist:desktop:artifact --platform win --target nsis --arch x64 --skip-build
```

Keep `node-pty` pinned to `1.2.0-beta.15` in the server manifest: its workspace
patch targets that exact version. Do not remove the patch to bypass an unused
patch error.

## 5. Publish Windows Updates

Stable installers default to the GitHub Releases feed in
`PatelYax/t3-code-enhanced`. `T3CODE_DESKTOP_UPDATE_REPOSITORY` overrides this;
otherwise `GITHUB_REPOSITORY` is used when set, such as in GitHub Actions.
Release assets must be publicly readable. Do not distribute a GitHub token to
desktop users or embed one in the app.

Install one newly built installer manually on machines running an older build
without an update feed. From then on, the desktop checks at startup and
periodically while running. Downloading and restarting to install remain
user-controlled. Web and mobile clients do not use this Windows update feed.

No CI/CD is required. Commit the release changes on `main`, then push them
without saving credentials:

```powershell
git -c credential.helper= -c core.askPass= push origin main
```

Choose a version higher than the installed version and build locally. For
example, use `0.0.46` only if all installed versions are lower:

```powershell
$version = "0.0.46"
$env:T3CODE_DESKTOP_UPDATE_REPOSITORY = "PatelYax/t3-code-enhanced"
Remove-Item Env:ATQOR_AZURE_PROFILE_PATH -ErrorAction SilentlyContinue
$env:Path = "$env:USERPROFILE\.cargo\bin;$env:Path"
pnpm run dist:desktop:artifact --platform win --target nsis --arch x64 --build-version $version
```

After the build succeeds:

1. Open `https://github.com/PatelYax/t3-code-enhanced/releases/new`.
2. Create the tag matching the build, such as `v0.0.46`, targeting `main`.
3. Upload all three files from the same build's `release` directory:
   `atQor-AI-Hub-0.0.46-x64.exe`,
   `atQor-AI-Hub-0.0.46-x64.exe.blockmap`, and `latest.yml`. Do not rename them
   or combine files from different builds.
4. Mark it as the latest release, leave the prerelease option off, and publish.
5. In an older feed-enabled installation, check for updates, download, and
   restart to install.

Pushing a commit to `main` alone does not publish an update. Upload release
assets through the browser, not Git commits. Never replace a successful
release's installer with different bytes under the same version.

The public-release build above omits the private Azure/OpenAI profile. Existing
local provider configuration remains on installed machines. Never upload an
installer containing a bundled API key to a public release. Unsigned Windows
installers may show SmartScreen warnings.

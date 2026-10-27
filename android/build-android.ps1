# Odogwu Android: one command does the GitHub part for you.
#   - installs the GitHub command-line tool if you don't have it (first time only)
#   - saves your signing key to GitHub as secrets (first time only)
#   - builds the app on GitHub and waits for it
#   - downloads the Play Store file (.aab) and a test APK to your Desktop
#
# Run from PowerShell:
#   powershell -ExecutionPolicy Bypass -File "$HOME\Downloads\build-android.ps1"
# Next time (an update), bump the version:
#   powershell -ExecutionPolicy Bypass -File "$HOME\Downloads\build-android.ps1" -VersionCode 2 -VersionName 2.0.1

param(
  [string]$Repo = "C:\Users\a\Documents\odogwu",
  [string]$KeyFolder = "$HOME\Downloads\Odogwu-Android-Key",
  [int]$VersionCode = 1,
  [string]$VersionName = "2.0.0",
  [string]$Out = "$HOME\Desktop\Odogwu-Android"
)
$ErrorActionPreference = "Continue"  # native tools report errors through exit codes, checked below
function Step($t) { Write-Host "`n==> $t" -ForegroundColor Yellow }
function Fail($t) { Write-Host "`nX $t" -ForegroundColor Red; exit 1 }

# ---- 1. GitHub CLI
Step "Checking the GitHub tool"
if (-not (Get-Command gh -ErrorAction SilentlyContinue)) {
  Write-Host "Installing GitHub CLI (one time)..."
  winget install --id GitHub.cli -e --accept-source-agreements --accept-package-agreements
  $env:Path = [Environment]::GetEnvironmentVariable("Path", "Machine") + ";" + [Environment]::GetEnvironmentVariable("Path", "User")
  if (-not (Get-Command gh -ErrorAction SilentlyContinue)) { Fail "GitHub CLI installed. Close PowerShell, open it again, and re-run this command." }
}
gh auth status 2>$null | Out-Null
if ($LASTEXITCODE -ne 0) {
  Write-Host "Sign in to GitHub in the browser window that opens (one time)..."
  gh auth login --hostname github.com --git-protocol https --web
  if ($LASTEXITCODE -ne 0) { Fail "GitHub sign-in didn't finish. Re-run this command." }
}

# ---- 2. The repo
if (-not (Test-Path "$Repo\.git")) { Fail "Can't find your Odogwu repo at $Repo. Re-run with -Repo 'C:\path\to\odogwu'." }
Set-Location $Repo
if (-not (Test-Path "$Repo\.github\workflows\android.yml")) { Fail "The Android files aren't in your repo yet. Copy in the latest odogwu.zip and git push first." }

# ---- 3. Signing key -> GitHub secrets (first time; safe to repeat)
$names = gh secret list 2>$null | Out-String
if ($names -notmatch "ANDROID_KEYSTORE_BASE64") {
  Step "Saving your signing key to GitHub (one time)"
  if (-not (Test-Path "$KeyFolder\KEEP-THIS-SAFE.txt")) {
    if (Test-Path "$HOME\Downloads\Odogwu-Android-Key.zip") {
      Expand-Archive "$HOME\Downloads\Odogwu-Android-Key.zip" -DestinationPath "$HOME\Downloads" -Force
    }
  }
  if (-not (Test-Path "$KeyFolder\KEEP-THIS-SAFE.txt")) { Fail "Can't find the key folder at $KeyFolder. Unzip Odogwu-Android-Key.zip into Downloads, or re-run with -KeyFolder 'C:\path'." }
  $info = Get-Content "$KeyFolder\KEEP-THIS-SAFE.txt" -Raw
  $pw = [regex]::Match($info, "Keystore password:\s+(\S+)").Groups[1].Value
  if (-not $pw) { Fail "Couldn't read the password from KEEP-THIS-SAFE.txt." }
  $b64 = (Get-Content "$KeyFolder\keystore-base64.txt" -Raw).Trim()
  gh secret set ANDROID_KEYSTORE_BASE64 --body $b64
  gh secret set ANDROID_KEYSTORE_PASSWORD --body $pw
  gh secret set ANDROID_KEY_ALIAS --body "upload"
  gh secret set ANDROID_KEY_PASSWORD --body $pw
  Write-Host "Key saved."
}

# ---- 4. Build on GitHub
Step "Building Odogwu $VersionName (version code $VersionCode) on GitHub. This takes about 5 minutes"
$before = gh run list --workflow android.yml --limit 1 --json databaseId -q ".[0].databaseId" 2>$null
gh workflow run android.yml -f versionCode=$VersionCode -f versionName=$VersionName
if ($LASTEXITCODE -ne 0) { Fail "Couldn't start the build. Check you pushed the latest code (git push), then re-run." }
$id = $null
for ($i = 0; $i -lt 30 -and -not $id; $i++) {
  Start-Sleep -Seconds 4
  $latest = gh run list --workflow android.yml --limit 1 --json databaseId -q ".[0].databaseId"
  if ($latest -and $latest -ne $before) { $id = $latest }
}
if (-not $id) { Fail "The build didn't start. Open GitHub -> Actions to see why." }
gh run watch $id --exit-status
if ($LASTEXITCODE -ne 0) {
  gh run view $id --log-failed | Select-Object -Last 40
  Fail "The build failed. Copy the red lines above and send them to Claude."
}

# ---- 5. Download
Step "Downloading to $Out"
if (Test-Path $Out) { Remove-Item $Out -Recurse -Force }
gh run download $id -D $Out
$aab = Get-ChildItem $Out -Recurse -Filter *.aab | Select-Object -First 1
$apk = Get-ChildItem $Out -Recurse -Filter *.apk | Select-Object -First 1
Write-Host "`nDone!" -ForegroundColor Green
Write-Host "Play Store file:  $($aab.FullName)"
Write-Host "Test on a phone:  $($apk.FullName)"
Invoke-Item $Out

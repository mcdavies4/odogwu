# Odogwu Android: one command does the GitHub part for you.
#   - installs the GitHub command-line tool if you don't have it (first time only)
#   - saves your signing key to GitHub as secrets (first time only)
#   - builds the app on GitHub and waits for it
#   - downloads the Play Store file (.aab) and a test APK to your Desktop
#
# Run from PowerShell:
#   powershell -ExecutionPolicy Bypass -File "$HOME\Downloads\build-android.ps1"
# Next time (an update), bump the version:
#   powershell -ExecutionPolicy Bypass -File "$HOME\Downloads\build-android.ps1" -VersionCode 3 -VersionName 2.0.2

param(
  [string]$Repo = "C:\Users\a\Documents\odogwu",
  [string]$KeyFolder = "$HOME\Downloads\Odogwu-Android-Key",
  [int]$VersionCode = 1,
  [string]$VersionName = "2.0.0",
  [string]$Out = "$HOME\Desktop\Odogwu-Android",
  [switch]$ResetKey
)
$ErrorActionPreference = "Continue"
function Step($t) { Write-Host "`n==> $t" -ForegroundColor Yellow }
function Ok($t) { Write-Host "    OK  $t" -ForegroundColor Green }
function Fail($t) { Write-Host "`nX  $t`n" -ForegroundColor Red; exit 1 }
trap { Fail "Unexpected error: $_" }

# ---- 1. Find the real GitHub CLI program (gh.exe), installing it if needed
Step "Finding the GitHub tool"
function Find-Gh {
  $c = Get-Command gh.exe -CommandType Application -ErrorAction SilentlyContinue | Select-Object -First 1
  if ($c) { return $c.Source }
  foreach ($p in @("$env:ProgramFiles\GitHub CLI\gh.exe", "${env:ProgramFiles(x86)}\GitHub CLI\gh.exe", "$env:LOCALAPPDATA\Programs\GitHub CLI\gh.exe")) {
    if (Test-Path $p) { return $p }
  }
  return $null
}
$gh = Find-Gh
if (-not $gh) {
  Write-Host "    Installing GitHub CLI (one time)..."
  winget install --id GitHub.cli -e --accept-source-agreements --accept-package-agreements | Out-Host
  $env:Path = [Environment]::GetEnvironmentVariable("Path", "Machine") + ";" + [Environment]::GetEnvironmentVariable("Path", "User")
  $gh = Find-Gh
}
if (-not $gh) { Fail "Couldn't find gh.exe. Close PowerShell, open it again, and re-run. If it still fails, install it from https://cli.github.com" }
Ok "$gh  ($((& $gh --version | Select-Object -First 1)))"

# ---- 2. Signed in to GitHub?
Step "Checking you're signed in to GitHub"
& $gh auth status *> $null
if ($LASTEXITCODE -ne 0) {
  Write-Host "    A browser window will open. Sign in to GitHub and approve (one time)."
  & $gh auth login --hostname github.com --git-protocol https --web | Out-Host
  & $gh auth status *> $null
  if ($LASTEXITCODE -ne 0) { Fail "GitHub sign-in didn't finish. Re-run this command." }
}
Ok "Signed in"

# ---- 3. The repo
Step "Checking your Odogwu repo"
if (-not (Test-Path "$Repo\.git")) { Fail "Can't find your Odogwu repo at $Repo" }
Set-Location $Repo
if (-not (Test-Path "$Repo\.github\workflows\android.yml")) { Fail "The Android files aren't in your repo yet. Copy in the latest odogwu.zip, then git add / commit / push." }
$repoName = (& $gh repo view --json nameWithOwner -q .nameWithOwner 2>$null | Out-String).Trim()
if (-not $repoName) { Fail "GitHub doesn't recognise this folder as your repo. Check 'git remote -v' shows your GitHub repo." }
Ok $repoName
git fetch -q origin 2>$null
$ahead = (git rev-list --count "origin/HEAD..HEAD" 2>$null | Out-String).Trim()
if ($ahead -and $ahead -ne "0") { Fail "You have $ahead commit(s) not pushed yet. Run 'git push' first, then re-run." }

# ---- 4. Signing key -> GitHub secrets (first time, or with -ResetKey)
Step "Signing key"
$existing = (& $gh secret list -R $repoName 2>$null | Out-String)
if ($ResetKey -or $existing -notmatch "ANDROID_KEYSTORE_BASE64") {
  if (-not (Test-Path "$KeyFolder\KEEP-THIS-SAFE.txt") -and (Test-Path "$HOME\Downloads\Odogwu-Android-Key.zip")) {
    Expand-Archive "$HOME\Downloads\Odogwu-Android-Key.zip" -DestinationPath "$HOME\Downloads" -Force
  }
  if (-not (Test-Path "$KeyFolder\KEEP-THIS-SAFE.txt")) { Fail "Can't find the key at $KeyFolder. Put Odogwu-Android-Key.zip in Downloads and re-run." }
  $info = Get-Content "$KeyFolder\KEEP-THIS-SAFE.txt" -Raw
  $pw = [regex]::Match($info, "Keystore password:\s+(\S+)").Groups[1].Value
  if (-not $pw) { Fail "Couldn't read the password from $KeyFolder\KEEP-THIS-SAFE.txt" }
  $b64 = (Get-Content "$KeyFolder\keystore-base64.txt" -Raw).Trim()
  foreach ($pair in @(@("ANDROID_KEYSTORE_BASE64", $b64), @("ANDROID_KEYSTORE_PASSWORD", $pw), @("ANDROID_KEY_ALIAS", "upload"), @("ANDROID_KEY_PASSWORD", $pw))) {
    & $gh secret set $pair[0] -R $repoName --body $pair[1] | Out-Host
    if ($LASTEXITCODE -ne 0) { Fail "Couldn't save $($pair[0]) to GitHub." }
  }
  Ok "Key saved to GitHub"
} else {
  Ok "Already on GitHub"
}

# ---- 5. Build on GitHub
Step "Building Odogwu $VersionName (version code $VersionCode) on GitHub. About 5 minutes"
$before = (& $gh run list -R $repoName --workflow android.yml --limit 1 --json databaseId -q ".[0].databaseId" 2>$null | Out-String).Trim()
& $gh workflow run android.yml -R $repoName -f versionCode=$VersionCode -f versionName=$VersionName | Out-Host
if ($LASTEXITCODE -ne 0) { Fail "Couldn't start the build. Check the push worked, then re-run." }
$id = $null
for ($i = 0; $i -lt 40 -and -not $id; $i++) {
  Start-Sleep -Seconds 4
  $latest = (& $gh run list -R $repoName --workflow android.yml --limit 1 --json databaseId -q ".[0].databaseId" 2>$null | Out-String).Trim()
  if ($latest -and $latest -ne $before) { $id = $latest }
}
if (-not $id) { Fail "The build didn't start. Open https://github.com/$repoName/actions to see why." }
Ok "Started: https://github.com/$repoName/actions/runs/$id"
& $gh run watch $id -R $repoName --exit-status | Out-Host
if ($LASTEXITCODE -ne 0) {
  & $gh run view $id -R $repoName --log-failed 2>$null | Select-Object -Last 40 | Out-Host
  Fail "The build failed. Copy the lines above and send them to Claude."
}

# ---- 6. Download
Step "Downloading to $Out"
if (Test-Path $Out) { Remove-Item $Out -Recurse -Force }
& $gh run download $id -R $repoName -D $Out | Out-Host
$aab = Get-ChildItem $Out -Recurse -Filter *.aab | Select-Object -First 1
$apk = Get-ChildItem $Out -Recurse -Filter *.apk | Select-Object -First 1
if (-not $aab) { Fail "The build finished but no .aab was downloaded. Open https://github.com/$repoName/actions/runs/$id" }
Write-Host "`nDone!" -ForegroundColor Green
Write-Host "Play Store file:  $($aab.FullName)"
Write-Host "Test on a phone:  $($apk.FullName)"
Invoke-Item $Out

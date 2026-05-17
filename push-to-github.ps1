# Neural AI - Push to GitHub Script
# Usage: .\push-to-github.ps1

Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  Neural AI - Push to GitHub" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

# Prompt for GitHub username
$username = Read-Host "Enter your GitHub username"
if ([string]::IsNullOrWhiteSpace($username)) {
    Write-Host "❌ Username cannot be empty!" -ForegroundColor Red
    exit 1
}

$repoUrl = "https://github.com/$username/neural-ai.git"

Write-Host ""
Write-Host "📍 Repository URL: $repoUrl" -ForegroundColor Yellow
Write-Host ""

# Check if remote already exists
$remoteExists = git remote get-url origin 2>$null
if ($remoteExists) {
    Write-Host "⚠️  Remote 'origin' already exists: $remoteExists" -ForegroundColor Yellow
    $confirm = Read-Host "Update it to the new URL? (y/n)"
    if ($confirm -ne "y") {
        Write-Host "❌ Cancelled" -ForegroundColor Red
        exit 1
    }
    git remote remove origin
}

# Add remote
Write-Host "🔗 Adding remote..." -ForegroundColor Green
git remote add origin $repoUrl

# Set branch to main
Write-Host "📌 Setting branch to main..." -ForegroundColor Green
git branch -M main

# Push
Write-Host "📤 Pushing to GitHub..." -ForegroundColor Green
git push -u origin main

if ($?) {
    Write-Host ""
    Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Green
    Write-Host "  ✅ SUCCESS!" -ForegroundColor Green
    Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Green
    Write-Host ""
    Write-Host "Your code is now on GitHub!" -ForegroundColor Green
    Write-Host "Repository: $repoUrl" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Next step: Deploy to Vercel"
    Write-Host "1. Go to https://vercel.com/dashboard" -ForegroundColor Yellow
    Write-Host "2. Click 'Add New' → 'Project'" -ForegroundColor Yellow
    Write-Host "3. Import from GitHub" -ForegroundColor Yellow
    Write-Host "4. Add environment variables (4 total)" -ForegroundColor Yellow
    Write-Host "5. Deploy!" -ForegroundColor Yellow
} else {
    Write-Host ""
    Write-Host "❌ Push failed!" -ForegroundColor Red
    Write-Host "Make sure:"
    Write-Host "  1. Repository $repoUrl exists on GitHub"
    Write-Host "  2. You have push permissions"
    Write-Host "  3. GitHub credentials are configured"
    exit 1
}

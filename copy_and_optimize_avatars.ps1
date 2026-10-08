Add-Type -AssemblyName System.Drawing

$sourceDir = "C:\Users\jithy\.gemini\antigravity-ide\brain\5183b00e-9f48-4e74-8245-a1006ec81318"
$targetDir = "$PSScriptRoot\frontend\assets\avatars"

if (!(Test-Path $targetDir)) {
    New-Item -ItemType Directory -Force -Path $targetDir | Out-Null
}

$avatars = @{
    "lion.png" = "lion_avatar_1791441791761.jpg"
    "elephant.png" = "elephant_avatar_1791441809840.jpg"
    "owl.png" = "owl_avatar_1791441829883.jpg"
    "rabbit.png" = "rabbit_avatar_1791441855573.jpg"
}

foreach ($name in $avatars.Keys) {
    $src = Join-Path $sourceDir $avatars[$name]
    $dest = Join-Path $targetDir $name

    if (Test-Path $src) {
        $bmp = [System.Drawing.Bitmap]::FromFile($src)
        $resized = New-Object System.Drawing.Bitmap(256, 256)
        $g = [System.Drawing.Graphics]::FromImage($resized)
        $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
        $g.DrawImage($bmp, 0, 0, 256, 256)
        $resized.Save($dest, [System.Drawing.Imaging.ImageFormat]::Png)
        $g.Dispose()
        $bmp.Dispose()
        $resized.Dispose()
        $size = (Get-Item $dest).Length / 1KB
        Write-Host "Created $name ($([math]::Round($size, 1)) KB)" -ForegroundColor Green
    } else {
        Write-Warning "Source image not found: $src"
    }
}
Write-Host "All 4 avatars resized to 256x256 PNG and bundled successfully!" -ForegroundColor Cyan

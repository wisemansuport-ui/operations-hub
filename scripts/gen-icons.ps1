Add-Type -AssemblyName System.Drawing

# -------------------------------------------------------
# Source: AI-generated Graphite Lightning Bolt icon (1024x1024)
# Goal: Resize to standard icon sizes. Image already has solid black background.
# -------------------------------------------------------

$src    = 'C:\Users\wisem\.gemini\antigravity\brain\bf3c00e4-1973-4b3b-9b03-2ec3940ba29e\grafite_lightning_only_icon_1778911137831.png'
$outDir = 'C:/Users/wisem/OneDrive/Desktop/operations-hub-main/operations-hub-main/public'

$original = [System.Drawing.Bitmap]::new($src)

$sizes = @(
  @{name='favicon.png';          w=32;  h=32},
  @{name='apple-touch-icon.png'; w=180; h=180},
  @{name='icon-192.png';         w=192; h=192},
  @{name='icon-512.png';         w=512; h=512}
)

foreach ($s in $sizes) {
  $bmp = New-Object System.Drawing.Bitmap($s.w, $s.h, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
  $g   = [System.Drawing.Graphics]::FromImage($bmp)

  $g.Clear([System.Drawing.Color]::Black)
  $g.InterpolationMode  = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
  $g.SmoothingMode      = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
  $g.PixelOffsetMode    = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
  $g.CompositingMode    = [System.Drawing.Drawing2D.CompositingMode]::SourceCopy
  $g.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality

  # Draw exactly as it is (already a perfect square)
  $g.DrawImage($original, 0, 0, $s.w, $s.h)
  $g.Dispose()

  $outPath = Join-Path $outDir $s.name
  $bmp.Save($outPath, [System.Drawing.Imaging.ImageFormat]::Png)
  $bmp.Dispose()
  Write-Host "Saved $($s.name) ($($s.w)x$($s.h))"
}

$original.Dispose()

# Keep a reference copy
Copy-Item $src 'C:\Users\wisem\OneDrive\Desktop\operations-hub-main\operations-hub-main\scripts\logo_source.png' -Force

Write-Host "Done! Graphite Lightning icon generated."

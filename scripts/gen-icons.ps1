Add-Type -AssemblyName System.Drawing

# -------------------------------------------------------
# Source: Exact image requested by user, transparent background
# Goal: Resize exactly as is, preserving transparency, no borders
# -------------------------------------------------------

$src    = 'C:\Users\wisem\.gemini\antigravity\brain\bf3c00e4-1973-4b3b-9b03-2ec3940ba29e\media__1778909963533.png'
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

  # Clear with fully transparent background
  $g.Clear([System.Drawing.Color]::Transparent)
  $g.InterpolationMode  = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
  $g.SmoothingMode      = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
  $g.PixelOffsetMode    = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
  $g.CompositingMode    = [System.Drawing.Drawing2D.CompositingMode]::SourceCopy
  $g.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality

  # Draw exactly as it is (no crop, no scaling offset)
  $g.DrawImage($original, 0, 0, $s.w, $s.h)
  $g.Dispose()

  $outPath = Join-Path $outDir $s.name
  $bmp.Save($outPath, [System.Drawing.Imaging.ImageFormat]::Png)
  $bmp.Dispose()
  Write-Host "Saved $($s.name) ($($s.w)x$($s.h)) exactly as is"
}

$original.Dispose()

# Keep a reference copy
Copy-Item $src 'C:\Users\wisem\OneDrive\Desktop\operations-hub-main\operations-hub-main\scripts\logo_source.png' -Force

Write-Host "Done! Transparency fully preserved."

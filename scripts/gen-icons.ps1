Add-Type -AssemblyName System.Drawing

$src    = 'C:\Users\wisem\.gemini\antigravity\brain\bf3c00e4-1973-4b3b-9b03-2ec3940ba29e\media__1778909963533.png'
$outDir = 'C:/Users/wisem/OneDrive/Desktop/operations-hub-main/operations-hub-main/public'

$original = [System.Drawing.Bitmap]::new($src)

$sizes = @(
  @{name='favicon.png';          w=32;  h=32},
  @{name='apple-touch-icon.png'; w=180; h=180},
  @{name='icon-192.png';         w=192; h=192},
  @{name='icon-512.png';         w=512; h=512}
)

# Crop box that tightly bounds the golden icon inside the transparent PNG
# Based on pixel scanning: Non-transparent bounds are roughly X:150-875, Y:120-890
# We use a square crop box of 770x770 to perfectly capture the edges
$srcRect = New-Object System.Drawing.Rectangle(127, 120, 770, 770)

foreach ($s in $sizes) {
  $bmp = New-Object System.Drawing.Bitmap($s.w, $s.h, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
  $g   = [System.Drawing.Graphics]::FromImage($bmp)

  # CRITICAL: Fill with solid black so iOS doesn't fill transparent corners with white
  $g.Clear([System.Drawing.Color]::FromArgb(255, 0, 0, 0))
  
  $g.InterpolationMode  = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
  $g.SmoothingMode      = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
  $g.PixelOffsetMode    = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
  $g.CompositingMode    = [System.Drawing.Drawing2D.CompositingMode]::SourceOver
  $g.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality

  $destRect = New-Object System.Drawing.Rectangle(0, 0, $s.w, $s.h)
  $g.DrawImage($original, $destRect, $srcRect, [System.Drawing.GraphicsUnit]::Pixel)
  $g.Dispose()

  $outPath = Join-Path $outDir $s.name
  $bmp.Save($outPath, [System.Drawing.Imaging.ImageFormat]::Png)
  $bmp.Dispose()
  Write-Host "Saved $($s.name) ($($s.w)x$($s.h))"
}

$original.Dispose()
Write-Host "Done!"

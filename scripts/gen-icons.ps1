Add-Type -AssemblyName System.Drawing

# -------------------------------------------------------
# Source: new logo JPG with black background and golden border
# Goal: produce icons where the golden border is the edge.
# Strategy:
#   Crop the image to the golden border bounding box
# -------------------------------------------------------

$src    = 'C:/Users/wisem/OneDrive/Desktop/operations-hub-main/operations-hub-main/scripts/logo_source.jpg'
$outDir = 'C:/Users/wisem/OneDrive/Desktop/operations-hub-main/operations-hub-main/public'

$original = [System.Drawing.Bitmap]::new($src)

$sizes = @(
  @{name='favicon.png';          w=32;  h=32},
  @{name='apple-touch-icon.png'; w=180; h=180},
  @{name='icon-192.png';         w=192; h=192},
  @{name='icon-512.png';         w=512; h=512}
)

# Crop box tightly around the golden border
$srcRect = New-Object System.Drawing.Rectangle(90, 90, 844, 844)

foreach ($s in $sizes) {
  $bmp = New-Object System.Drawing.Bitmap($s.w, $s.h, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
  $g   = [System.Drawing.Graphics]::FromImage($bmp)

  $g.Clear([System.Drawing.Color]::Transparent)
  $g.InterpolationMode  = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
  $g.SmoothingMode      = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
  $g.PixelOffsetMode    = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
  $g.CompositingMode    = [System.Drawing.Drawing2D.CompositingMode]::SourceCopy
  $g.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality

  $destRect = New-Object System.Drawing.Rectangle(0, 0, $s.w, $s.h)
  $g.DrawImage($original, $destRect, $srcRect, [System.Drawing.GraphicsUnit]::Pixel)
  $g.Dispose()

  $outPath = Join-Path $outDir $s.name
  $bmp.Save($outPath, [System.Drawing.Imaging.ImageFormat]::Png)
  $bmp.Dispose()
  Write-Host "Saved $($s.name) ($($s.w)x$($s.h)) cropped"
}

$original.Dispose()
Write-Host "All icons generated with golden border as the edge."

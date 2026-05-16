Add-Type -AssemblyName System.Drawing

# -------------------------------------------------------
# Source: new logo PNG with transparent background
# Goal: produce fully-opaque icons with NO white border
# Strategy:
#   1. Fill canvas with solid #0A0A0A (matches icon bg)
#   2. Draw image at 110% scale — crops the transparent fringe
#   3. Pixel-walk to flatten any remaining semi-transparent px
# -------------------------------------------------------

$src    = 'C:/Users/wisem/OneDrive/Desktop/operations-hub-main/operations-hub-main/scripts/logo_source.png'
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

  # 1. Fill with solid black — kills all transparency
  $g.Clear([System.Drawing.Color]::FromArgb(255, 10, 10, 10))

  $g.InterpolationMode  = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
  $g.SmoothingMode      = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
  $g.PixelOffsetMode    = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
  $g.CompositingMode    = [System.Drawing.Drawing2D.CompositingMode]::SourceOver
  $g.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality

  # 2. Draw at 110% — clips anti-aliased transparent fringe at corners
  $overScale = 1.10
  $dw = [int]($s.w * $overScale)
  $dh = [int]($s.h * $overScale)
  $dx = -[int](($dw - $s.w) / 2)
  $dy = -[int](($dh - $s.h) / 2)
  $g.DrawImage($original, $dx, $dy, $dw, $dh)
  $g.Dispose()

  # 3. Pixel-walk: flatten any remaining semi-transparent pixels onto black
  for ($y = 0; $y -lt $s.h; $y++) {
    for ($x = 0; $x -lt $s.w; $x++) {
      $px = $bmp.GetPixel($x, $y)
      if ($px.A -lt 255) {
        $alpha = $px.A / 255.0
        $r = [int]($px.R * $alpha + 10 * (1 - $alpha))
        $gv = [int]($px.G * $alpha + 10 * (1 - $alpha))
        $b = [int]($px.B * $alpha + 10 * (1 - $alpha))
        $bmp.SetPixel($x, $y, [System.Drawing.Color]::FromArgb(255, $r, $gv, $b))
      }
    }
  }

  $outPath = Join-Path $outDir $s.name
  $bmp.Save($outPath, [System.Drawing.Imaging.ImageFormat]::Png)
  $bmp.Dispose()
  Write-Host "Saved $($s.name) ($($s.w)x$($s.h))"
}

$original.Dispose()
Write-Host "All icons generated. Zero white borders."

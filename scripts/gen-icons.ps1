Add-Type -AssemblyName System.Drawing

$src    = 'C:/Users/wisem/.gemini/antigravity/brain/bf3c00e4-1973-4b3b-9b03-2ec3940ba29e/media__1778885097777.jpg'
$outDir = 'C:/Users/wisem/OneDrive/Desktop/operations-hub-main/operations-hub-main/public'

# Load the source (may have transparency)
$original = [System.Drawing.Bitmap]::new($src)

$sizes = @(
  @{name='favicon.png';          w=32;  h=32},
  @{name='apple-touch-icon.png'; w=180; h=180},
  @{name='icon-192.png';         w=192; h=192},
  @{name='icon-512.png';         w=512; h=512}
)

foreach ($s in $sizes) {
  # Step 1: resize source onto a black canvas with proper alpha compositing
  $bmp = New-Object System.Drawing.Bitmap($s.w, $s.h, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
  $g   = [System.Drawing.Graphics]::FromImage($bmp)

  # Paint solid black so any transparent pixels become black (no white)
  $g.Clear([System.Drawing.Color]::FromArgb(255, 10, 10, 10))

  $g.InterpolationMode  = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
  $g.SmoothingMode      = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
  $g.PixelOffsetMode    = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
  $g.CompositingMode    = [System.Drawing.Drawing2D.CompositingMode]::SourceOver
  $g.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality

  # Draw image slightly overscaled (106%) so the transparent rounded-corner fringe is clipped
  $overScale = 1.06
  $dw = [int]($s.w * $overScale)
  $dh = [int]($s.h * $overScale)
  $dx = -[int](($dw - $s.w) / 2)
  $dy = -[int](($dh - $s.h) / 2)
  $g.DrawImage($original, $dx, $dy, $dw, $dh)
  $g.Dispose()

  # Step 2: flatten – replace any remaining alpha with solid black
  for ($y = 0; $y -lt $s.h; $y++) {
    for ($x = 0; $x -lt $s.w; $x++) {
      $px = $bmp.GetPixel($x, $y)
      if ($px.A -lt 255) {
        $alpha = $px.A / 255.0
        $r = [int]($px.R * $alpha)
        $gr = [int]($px.G * $alpha)
        $b = [int]($px.B * $alpha)
        $bmp.SetPixel($x, $y, [System.Drawing.Color]::FromArgb(255, $r, $gr, $b))
      }
    }
  }

  $outPath = Join-Path $outDir $s.name
  $bmp.Save($outPath, [System.Drawing.Imaging.ImageFormat]::Png)
  $bmp.Dispose()
  Write-Host "Saved $($s.name) ($($s.w)x$($s.h))"
}

$original.Dispose()
Write-Host "All done. No white borders."

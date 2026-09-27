$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing
$mobileRoot = Split-Path -Parent $PSScriptRoot
$websiteRoot = Join-Path (Split-Path -Parent $mobileRoot) 'CommunityCOnnect_Website'
$mobileAssets = Join-Path $mobileRoot 'assets'
$websitePublic = Join-Path $websiteRoot 'public'

function Convert-BrandColor([string]$value) { return [System.Drawing.ColorTranslator]::FromHtml($value) }
function Map-BrandCoordinate([single]$value, [single]$scale) { return [single](512 + (($value - 512) * $scale)) }
function Map-BrandPoint([single]$x, [single]$y, [single]$scale) {
  return [System.Drawing.PointF]::new((Map-BrandCoordinate $x $scale), (Map-BrandCoordinate $y $scale))
}
function Draw-CommunityMark([System.Drawing.Graphics]$graphics, [string]$markColor, [string]$sparkColor, [single]$scale) {
  $sidePen = [System.Drawing.Pen]::new((Convert-BrandColor $markColor), (62 * $scale))
  $sidePen.StartCap = [System.Drawing.Drawing2D.LineCap]::Round
  $sidePen.EndCap = [System.Drawing.Drawing2D.LineCap]::Round
  $sidePen.LineJoin = [System.Drawing.Drawing2D.LineJoin]::Round
  $bodyPen = [System.Drawing.Pen]::new((Convert-BrandColor $markColor), (72 * $scale))
  $bodyPen.StartCap = [System.Drawing.Drawing2D.LineCap]::Round
  $bodyPen.EndCap = [System.Drawing.Drawing2D.LineCap]::Round
  $bodyPen.LineJoin = [System.Drawing.Drawing2D.LineJoin]::Round
  $path = [System.Drawing.Drawing2D.GraphicsPath]::new()
  $path.AddBezier((Map-BrandPoint 156 716 $scale), (Map-BrandPoint 156 611 $scale), (Map-BrandPoint 201 548 $scale), (Map-BrandPoint 270 548 $scale))
  $path.AddBezier((Map-BrandPoint 270 548 $scale), (Map-BrandPoint 320 548 $scale), (Map-BrandPoint 355 587 $scale), (Map-BrandPoint 382 643 $scale))
  $graphics.DrawPath($sidePen, $path)
  $path.Reset()
  $path.AddBezier((Map-BrandPoint 868 716 $scale), (Map-BrandPoint 868 611 $scale), (Map-BrandPoint 823 548 $scale), (Map-BrandPoint 754 548 $scale))
  $path.AddBezier((Map-BrandPoint 754 548 $scale), (Map-BrandPoint 704 548 $scale), (Map-BrandPoint 669 587 $scale), (Map-BrandPoint 642 643 $scale))
  $graphics.DrawPath($sidePen, $path)
  $path.Reset()
  $path.AddBezier((Map-BrandPoint 366 670 $scale), (Map-BrandPoint 366 536 $scale), (Map-BrandPoint 426 466 $scale), (Map-BrandPoint 512 466 $scale))
  $path.AddBezier((Map-BrandPoint 512 466 $scale), (Map-BrandPoint 598 466 $scale), (Map-BrandPoint 658 536 $scale), (Map-BrandPoint 658 670 $scale))
  $graphics.DrawPath($bodyPen, $path)
  $headBrush = [System.Drawing.SolidBrush]::new((Convert-BrandColor $markColor))
  foreach ($head in @(@(512,285,78), @(270,416,62), @(754,416,62))) {
    $radius = $head[2] * $scale
    $cx = Map-BrandCoordinate $head[0] $scale
    $cy = Map-BrandCoordinate $head[1] $scale
    $graphics.FillEllipse($headBrush, [single]($cx - $radius), [single]($cy - $radius), [single](2 * $radius), [single](2 * $radius))
  }
  $spark = [System.Drawing.Drawing2D.GraphicsPath]::new()
  $points = @(
    (Map-BrandPoint 512 728 $scale), (Map-BrandPoint 534 772 $scale),
    (Map-BrandPoint 580 794 $scale), (Map-BrandPoint 534 816 $scale),
    (Map-BrandPoint 512 860 $scale), (Map-BrandPoint 490 816 $scale),
    (Map-BrandPoint 444 794 $scale), (Map-BrandPoint 490 772 $scale)
  )
  $spark.AddPolygon([System.Drawing.PointF[]]$points)
  $sparkBrush = [System.Drawing.SolidBrush]::new((Convert-BrandColor $sparkColor))
  $graphics.FillPath($sparkBrush, $spark)
  $sparkBrush.Dispose()
  $spark.Dispose()
  $headBrush.Dispose()
  $path.Dispose()
  $sidePen.Dispose()
  $bodyPen.Dispose()
}
function Write-CommunityPng([string]$path, [int]$size, [string]$background, [string]$markColor, [string]$sparkColor, [single]$scale = 1, [switch]$gradient) {
  $bitmap = [System.Drawing.Bitmap]::new($size, $size, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
  $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
  $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
  $graphics.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
  $graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
  if ($background -eq 'transparent') {
    $graphics.Clear([System.Drawing.Color]::Transparent)
  } elseif ($gradient) {
    $rect = [System.Drawing.Rectangle]::new(0, 0, $size, $size)
    $brush = [System.Drawing.Drawing2D.LinearGradientBrush]::new($rect, (Convert-BrandColor '#164A36'), (Convert-BrandColor $background), 38)
    $graphics.FillRectangle($brush, $rect)
    $brush.Dispose()
  } else {
    $graphics.Clear((Convert-BrandColor $background))
  }
  Draw-CommunityMark $graphics $markColor $sparkColor $scale
  $graphics.Dispose()
  $bitmap.Save($path, [System.Drawing.Imaging.ImageFormat]::Png)
  $bitmap.Dispose()
}

$ink = '#103B2D'
$deep = '#0E3B2A'
$lime = '#C9EF44'
$cream = '#FFF9EA'
$markSvg = @'
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024">
  <g fill="none" stroke="#103b2d" stroke-linecap="round" stroke-linejoin="round">
    <path d="M156 716C156 611 201 548 270 548c50 0 85 39 112 95" stroke-width="62"/>
    <path d="M868 716c0-105-45-168-114-168-50 0-85 39-112 95" stroke-width="62"/>
    <path d="M366 670c0-134 60-204 146-204s146 70 146 204" stroke-width="72"/>
  </g>
  <g fill="#103b2d"><circle cx="512" cy="285" r="78"/><circle cx="270" cy="416" r="62"/><circle cx="754" cy="416" r="62"/></g>
  <path fill="#fff9ea" d="m512 728 22 44 46 22-46 22-22 44-22-44-46-22 46-22z"/>
</svg>
'@
Set-Content -Path (Join-Path $mobileAssets 'community-connect-mark.svg') -Value $markSvg -Encoding utf8
Set-Content -Path (Join-Path $websitePublic 'community-connect-mark.svg') -Value $markSvg -Encoding utf8
$faviconSvg = @'
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024">
  <rect width="1024" height="1024" fill="#0e3b2a"/>
  <g fill="none" stroke="#fff9ea" stroke-linecap="round" stroke-linejoin="round">
    <path d="M156 716C156 611 201 548 270 548c50 0 85 39 112 95" stroke-width="62"/>
    <path d="M868 716c0-105-45-168-114-168-50 0-85 39-112 95" stroke-width="62"/>
    <path d="M366 670c0-134 60-204 146-204s146 70 146 204" stroke-width="72"/>
  </g>
  <g fill="#fff9ea"><circle cx="512" cy="285" r="78"/><circle cx="270" cy="416" r="62"/><circle cx="754" cy="416" r="62"/></g>
  <path fill="#c9ef44" d="m512 728 22 44 46 22-46 22-22 44-22-44-46-22 46-22z"/>
</svg>
'@
Set-Content -Path (Join-Path $websitePublic 'favicon.svg') -Value $faviconSvg -Encoding utf8

Write-CommunityPng (Join-Path $mobileAssets 'community-connect-logo.png') 1024 'transparent' $ink $cream 1.04
Write-CommunityPng (Join-Path $websitePublic 'community-connect-logo.png') 1024 'transparent' $ink $cream 1.04
Write-CommunityPng (Join-Path $mobileAssets 'community-connect-app-icon.png') 1024 $deep $cream $lime 1.04 -gradient
Write-CommunityPng (Join-Path $websitePublic 'app-icon.png') 1024 $deep $cream $lime 1.04 -gradient
Write-CommunityPng (Join-Path $mobileAssets 'community-connect-android-foreground.png') 1024 'transparent' $cream $lime 0.8
Write-CommunityPng (Join-Path $mobileAssets 'community-connect-android-monochrome.png') 1024 'transparent' '#FFFFFF' '#FFFFFF' 0.8
Write-CommunityPng (Join-Path $mobileAssets 'community-connect-android-background.png') 1024 $deep $deep $deep
Write-CommunityPng (Join-Path $mobileAssets 'icon.png') 1024 $deep $cream $lime 1.04 -gradient
Write-CommunityPng (Join-Path $mobileAssets 'favicon.png') 64 $deep $cream $lime 1.04 -gradient
Write-CommunityPng (Join-Path $mobileAssets 'splash-icon.png') 1024 'transparent' $cream $lime 0.8
Write-CommunityPng (Join-Path $mobileAssets 'android-icon-foreground.png') 1024 'transparent' $cream $lime 0.8
Write-CommunityPng (Join-Path $mobileAssets 'android-icon-monochrome.png') 1024 'transparent' '#FFFFFF' '#FFFFFF' 0.8
Write-CommunityPng (Join-Path $mobileAssets 'android-icon-background.png') 1024 $deep $deep $deep
Write-CommunityPng (Join-Path $mobileAssets 'community-connect-logo-source.png') 1024 'transparent' $ink $cream 1.04
Write-CommunityPng (Join-Path $websitePublic 'favicon.png') 64 $deep $cream $lime 1.04 -gradient

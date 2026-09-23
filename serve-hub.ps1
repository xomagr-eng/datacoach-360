# COACH HUB — σερβίρει DATA COACH 360° και TACTIX από την ΙΔΙΑ διεύθυνση (ίδιο origin),
# ώστε να μοιράζονται localStorage και να ανταλλάσσουν δεδομένα ζωντανά.
#   http://localhost:5265/datacoach/   → D:\PROJECTS\DataCoach360
#   http://localhost:5265/tactix/      → D:\PROJECTS\ProponitisPodosfairou
# Σερβίρει ΜΟΝΟ αυτούς τους δύο φακέλους (τίποτα άλλο από το D:\PROJECTS).
param([int]$Port = 5265)

$ErrorActionPreference = "Stop"
$routes = [ordered]@{
  "datacoach" = (Resolve-Path (Join-Path $PSScriptRoot ".")).Path
  "tactix"    = (Resolve-Path (Join-Path $PSScriptRoot "..\ProponitisPodosfairou")).Path
}
$prefix = "http://localhost:$Port/"
$mime = @{
  ".html" = "text/html; charset=utf-8"; ".js" = "application/javascript; charset=utf-8"; ".css" = "text/css; charset=utf-8"
  ".json" = "application/json; charset=utf-8"; ".webmanifest" = "application/manifest+json; charset=utf-8"
  ".png" = "image/png"; ".jpg" = "image/jpeg"; ".svg" = "image/svg+xml"; ".ico" = "image/x-icon"; ".txt" = "text/plain; charset=utf-8"
}
$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add($prefix)
try { $listener.Start() } catch { Write-Host "ERROR: could not bind $prefix - $($_.Exception.Message)"; exit 1 }
Write-Host "Coach Hub on $prefix  →  /datacoach/  και  /tactix/"

$landing = [System.Text.Encoding]::UTF8.GetBytes(@"
<!doctype html><meta charset="utf-8"><title>Coach Hub</title>
<body style="background:#0b0d12;color:#fff;font-family:Segoe UI,sans-serif;display:grid;place-items:center;height:100vh;margin:0">
<div style="text-align:center"><h1>⚽ Coach Hub</h1><p style="color:#98a0b3">Οι δύο εφαρμογές μοιράζονται δεδομένα ζωντανά.</p>
<a href="/datacoach/" style="display:inline-block;margin:8px;padding:14px 22px;background:#e11d2e;color:#fff;border-radius:10px;text-decoration:none;font-weight:700">📊 DATA COACH 360°</a>
<a href="/tactix/" style="display:inline-block;margin:8px;padding:14px 22px;background:#1b2030;color:#fff;border-radius:10px;text-decoration:none;font-weight:700;border:1px solid #333">🧠 TACTIX</a></div></body>
"@)

while ($listener.IsListening) {
  try {
    $context = $listener.GetContext(); $req = $context.Request; $res = $context.Response
    $rel = [Uri]::UnescapeDataString($req.Url.LocalPath).TrimStart("/")
    $parts = $rel.Split("/", 2)
    if ([string]::IsNullOrWhiteSpace($rel)) {
      $res.ContentType = "text/html; charset=utf-8"; $res.OutputStream.Write($landing, 0, $landing.Length)
    } elseif ($routes.Contains($parts[0])) {
      if ($parts.Length -eq 1) { $res.Redirect("/" + $parts[0] + "/"); $res.Close(); continue }
      $root = $routes[$parts[0]]
      $sub = $parts[1]; if ([string]::IsNullOrWhiteSpace($sub)) { $sub = "index.html" }
      $filePath = [System.IO.Path]::GetFullPath((Join-Path $root $sub))
      if ($filePath.StartsWith($root, [System.StringComparison]::OrdinalIgnoreCase) -and (Test-Path $filePath -PathType Leaf)) {
        $ext = [System.IO.Path]::GetExtension($filePath).ToLowerInvariant()
        $ct = $mime[$ext]; if (-not $ct) { $ct = "application/octet-stream" }
        $res.ContentType = $ct
        $bytes = [System.IO.File]::ReadAllBytes($filePath)
        $res.ContentLength64 = $bytes.Length; $res.OutputStream.Write($bytes, 0, $bytes.Length)
      } else { $res.StatusCode = 404 }
    } else { $res.StatusCode = 404 }
    $res.OutputStream.Close()
  } catch { }
}

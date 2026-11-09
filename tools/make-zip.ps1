# Packt den Inhalt von _site/ nach deploy-site.zip (index.html im Wurzelverzeichnis, Schrägstriche in den Pfaden).
$root = Split-Path -Parent $PSScriptRoot
$src = Join-Path $root '_site'
$zip = Join-Path $root 'deploy-site.zip'
Add-Type -AssemblyName System.IO.Compression
Add-Type -AssemblyName System.IO.Compression.FileSystem
if (Test-Path $zip) { Remove-Item $zip -Force }
$z = [System.IO.Compression.ZipFile]::Open($zip, 'Create')
try {
  Get-ChildItem $src -Recurse -File | ForEach-Object {
    $rel = $_.FullName.Substring($src.Length + 1).Replace('\', '/')
    [void][System.IO.Compression.ZipFileExtensions]::CreateEntryFromFile($z, $_.FullName, $rel, 'Optimal')
  }
} finally { $z.Dispose() }
$z = [System.IO.Compression.ZipFile]::OpenRead($zip)
"{0} Dateien, erste: {1}" -f $z.Entries.Count, (($z.Entries | Select-Object -First 3 | ForEach-Object FullName) -join ', ')
$z.Dispose()

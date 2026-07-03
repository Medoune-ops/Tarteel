# Genere les 28 fichiers audio des noms de lettres arabes via Google Translate TTS.
# Telechargement ONE-SHOT (pas depuis l'app) : les MP3 sont ensuite bundles dans
# l'app -> aucun appel reseau au runtime. Le User-Agent navigateur + Referer
# contournent le blocage 403 que Google applique aux clients non-navigateurs.
#
# Executer une seule fois :
#   powershell -ExecutionPolicy Bypass -File "assets/sounds/letters/download.ps1"

$outDir = Split-Path -Parent $MyInvocation.MyCommand.Path

# Helper : construit une chaine depuis des points de code Unicode (evite les
# problemes d'encodage du .ps1 sous Windows PowerShell 5.1).
function U { param([int[]]$codes) -join ($codes | ForEach-Object { [char]$_ }) }

# key -> nom arabe VOCALISE de la lettre (avec voyelles pour une bonne prononciation)
$letters = @(
  @{ key="alif";  ar=(U 0x0623,0x064E,0x0644,0x0650,0x0641) },            # أَلِف
  @{ key="ba";    ar=(U 0x0628,0x064E,0x0627,0x0621) },                   # بَاء
  @{ key="ta";    ar=(U 0x062A,0x064E,0x0627,0x0621) },                   # تَاء
  @{ key="tha";   ar=(U 0x062B,0x064E,0x0627,0x0621) },                   # ثَاء
  @{ key="jeem";  ar=(U 0x062C,0x0650,0x064A,0x0645) },                   # جِيم
  @{ key="ha";    ar=(U 0x062D,0x064E,0x0627,0x0621) },                   # حَاء
  @{ key="kha";   ar=(U 0x062E,0x064E,0x0627,0x0621) },                   # خَاء
  @{ key="dal";   ar=(U 0x062F,0x064E,0x0627,0x0644) },                   # دَال
  @{ key="dhal";  ar=(U 0x0630,0x064E,0x0627,0x0644) },                   # ذَال
  @{ key="ra";    ar=(U 0x0631,0x064E,0x0627,0x0621) },                   # رَاء
  @{ key="zay";   ar=(U 0x0632,0x064E,0x0627,0x064A) },                   # زَاي
  @{ key="sin";   ar=(U 0x0633,0x0650,0x064A,0x0646) },                   # سِين
  @{ key="shin";  ar=(U 0x0634,0x0650,0x064A,0x0646) },                   # شِين
  @{ key="sad";   ar=(U 0x0635,0x064E,0x0627,0x062F) },                   # صَاد
  @{ key="dad";   ar=(U 0x0636,0x064E,0x0627,0x062F) },                   # ضَاد
  @{ key="ta2";   ar=(U 0x0637,0x064E,0x0627,0x0621) },                   # طَاء
  @{ key="dha2";  ar=(U 0x0638,0x064E,0x0627,0x0621) },                   # ظَاء
  @{ key="ayn";   ar=(U 0x0639,0x064E,0x064A,0x0646) },                   # عَيْن
  @{ key="ghayn"; ar=(U 0x063A,0x064E,0x064A,0x0646) },                   # غَيْن
  @{ key="fa";    ar=(U 0x0641,0x064E,0x0627,0x0621) },                   # فَاء
  @{ key="qaf";   ar=(U 0x0642,0x064E,0x0627,0x0641) },                   # قَاف
  @{ key="kaf";   ar=(U 0x0643,0x064E,0x0627,0x0641) },                   # كَاف
  @{ key="lam";   ar=(U 0x0644,0x064E,0x0627,0x0645) },                   # لَام
  @{ key="mim";   ar=(U 0x0645,0x0650,0x064A,0x0645) },                   # مِيم
  @{ key="nun";   ar=(U 0x0646,0x064F,0x0648,0x0646) },                   # نُون
  @{ key="ha2";   ar=(U 0x0647,0x064E,0x0627,0x0621) },                   # هَاء
  @{ key="waw";   ar=(U 0x0648,0x064E,0x0627,0x0648) },                   # وَاو
  @{ key="ya";    ar=(U 0x064A,0x064E,0x0627,0x0621) }                    # يَاء
)

$ua = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36"
$ok = 0; $fail = 0

foreach ($l in $letters) {
  $dest = Join-Path $outDir "$($l.key).mp3"
  if (Test-Path $dest) { Write-Host "  skip  $($l.key).mp3"; $ok++; continue }

  $txt = [uri]::EscapeDataString($l.ar)
  $url = "https://translate.google.com/translate_tts?ie=UTF-8&client=tw-ob&tl=ar&q=$txt"
  Start-Sleep -Milliseconds 400   # espacer les requetes
  try {
    Invoke-WebRequest -Uri $url -OutFile $dest -UserAgent $ua `
      -Headers @{ "Referer" = "https://translate.google.com/" } -TimeoutSec 20
    $size = (Get-Item $dest).Length
    if ($size -lt 500) { throw "fichier trop petit ($size octets) - probable blocage" }
    Write-Host "  ok    $($l.key).mp3  ($size octets)"
    $ok++
  } catch {
    Write-Host "  FAIL  $($l.key) - $($_.Exception.Message)"
    if (Test-Path $dest) { Remove-Item $dest -Force }
    $fail++
  }
}

Write-Host ""
Write-Host "Done: $ok ok, $fail failed."

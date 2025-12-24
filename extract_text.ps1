Write-Host "📄 Extracting ALL text content safely..."

# Paths to scan
$files = Get-ChildItem -Recurse -Include *.jsx, *.js, *.json -ErrorAction SilentlyContinue

# Output file
$outFile = "./all_text.txt"
Set-Content $outFile ""  # Clear previous content

foreach ($file in $files) {
    Write-Host "Scanning: $($file.FullName)"

    $content = Get-Content $file.FullName -Raw

    # Extract text inside quotes OR JSX content between >...<
    # Fixed escaping for PowerShell single-quoted string: '' represents a literal single quote
    $regex = '(?<=>)([^<>]+)(?=<)|"([^"]+)"|''([^'']+)'''

    $matches = [regex]::Matches($content, $regex)

    if ($matches.Count -gt 0) {
        Add-Content $outFile "`n===== FILE: $($file.Name) ====="

        foreach ($m in $matches) {
            $text = $m.Value.Trim()

            # Filter out technical code words
            if ($text -match "[A-Za-z]" -and $text.Length -gt 3) {
                Add-Content $outFile $text
            }
        }
    }
}

Write-Host "`n✅ DONE! All extracted text saved to → all_text.txt"
Write-Host "📌 Open all_text.txt and paste its content here."

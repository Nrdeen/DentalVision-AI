$corrections = @()
$splits = @("train", "valid", "test")

foreach ($split in $splits) {
    $labelFiles = Get-ChildItem "data/intraoral/processed/annotated_caries/labels/$split" -Filter *.txt
    
    foreach ($file in $labelFiles) {
        $lines = Get-Content $file.FullName
        $newLines = @()
        $fileChanged = $false
        
        foreach ($line in $lines) {
            if ($line.Trim() -ne "") {
                $parts = $line.Trim() -split '\s+'
                
                if ($parts.Length -eq 5) {
                    $cid = $parts[0]
                    $cx = [double]$parts[1]
                    $cy = [double]$parts[2]
                    $w = [double]$parts[3]
                    $h = [double]$parts[4]
                    
                    $original = "$cx $cy $w $h"
                    
                    # Only correct if actually out of bounds
                    $needsFix = ($cx -lt 0 -or $cx -gt 1 -or $cy -lt 0 -or $cy -gt 1 -or $w -le 0 -or $w -gt 1 -or $h -le 0 -or $h -gt 1)
                    
                    if ($needsFix) {
                        # Clip to [0, 1]
                        $cx = [math]::Max(0, [math]::Min(1, $cx))
                        $cy = [math]::Max(0, [math]::Min(1, $cy))
                        $w = [math]::Max(0.001, [math]::Min(1, $w))
                        $h = [math]::Max(0.001, [math]::Min(1, $h))
                        
                        $corrected = "$cx $cy $w $h"
                        
                        $corrections += [PSCustomObject]@{
                            split = $split
                            filename = $file.Name
                            class = $cid
                            original = $original
                            corrected = $corrected
                        }
                        $fileChanged = $true
                        $newLines += "$cid $cx $cy $w $h"
                    } else {
                        $newLines += $line
                    }
                } else {
                    $newLines += $line
                }
            } else {
                $newLines += $line
            }
        }
        
        if ($fileChanged) {
            Set-Content $file.FullName ($newLines -join "`n") -NoNewline
        }
    }
}

Write-Host "Total corrections: $($corrections.Count)"
$corrections | Export-Csv "data/intraoral/processed/annotated_caries/bbox_corrections.csv" -NoTypeInformation

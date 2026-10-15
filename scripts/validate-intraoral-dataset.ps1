# Validation script for processed intraoral dataset
$errors = @()
$warnings = @()

Write-Host "=== VALIDATION REPORT ===" -ForegroundColor Cyan
Write-Host ""

# 1. Check image counts
Write-Host "1. Checking image counts..." -ForegroundColor Yellow
$trainImages = (Get-ChildItem "data/intraoral/processed/annotated_caries/images/train").Count
$validImages = (Get-ChildItem "data/intraoral/processed/annotated_caries/images/valid").Count
$testImages = (Get-ChildItem "data/intraoral/processed/annotated_caries/images/test").Count
$totalImages = $trainImages + $validImages + $testImages

Write-Host "   Train images: $trainImages"
Write-Host "   Valid images: $validImages"
Write-Host "   Test images: $testImages"
Write-Host "   Total images: $totalImages"
Write-Host ""

if ($totalImages -ne 2227) {
    $errors += "Expected 2227 images, found $totalImages"
}

# 2. Check label counts
Write-Host "2. Checking label counts..." -ForegroundColor Yellow
$trainLabels = (Get-ChildItem "data/intraoral/processed/annotated_caries/labels/train").Count
$validLabels = (Get-ChildItem "data/intraoral/processed/annotated_caries/labels/valid").Count
$testLabels = (Get-ChildItem "data/intraoral/processed/annotated_caries/labels/test").Count
$totalLabels = $trainLabels + $validLabels + $testLabels

Write-Host "   Train labels: $trainLabels"
Write-Host "   Valid labels: $validLabels"
Write-Host "   Test labels: $testLabels"
Write-Host "   Total labels: $totalLabels"
Write-Host ""

if ($totalLabels -ne $totalImages) {
    $errors += "Image and label counts mismatch: $totalImages images vs $totalLabels labels"
}

# 3. Check negative images
Write-Host "3. Checking negative images..." -ForegroundColor Yellow
$trainNegatives = 0
$validNegatives = 0
$testNegatives = 0

Get-ChildItem "data/intraoral/processed/annotated_caries/labels/train" -Filter *.txt | ForEach-Object {
    if ((Get-Content $_.FullName).Trim() -eq "") { $trainNegatives++ }
}
Get-ChildItem "data/intraoral/processed/annotated_caries/labels/valid" -Filter *.txt | ForEach-Object {
    if ((Get-Content $_.FullName).Trim() -eq "") { $validNegatives++ }
}
Get-ChildItem "data/intraoral/processed/annotated_caries/labels/test" -Filter *.txt | ForEach-Object {
    if ((Get-Content $_.FullName).Trim() -eq "") { $testNegatives++ }
}

$totalNegatives = $trainNegatives + $validNegatives + $testNegatives
Write-Host "   Train negatives: $trainNegatives"
Write-Host "   Valid negatives: $validNegatives"
Write-Host "   Test negatives: $testNegatives"
Write-Host "   Total negatives: $totalNegatives"
Write-Host ""

if ($totalNegatives -ne 0) {
    $errors += "Expected 0 negatives (images not available), found $totalNegatives"
}

# 4. Check bounding boxes by class
Write-Host "4. Checking bounding boxes by class..." -ForegroundColor Yellow
$class0Count = 0
$class1Count = 0
$invalidClassIds = @()

$splits = @("train", "valid", "test")
foreach ($split in $splits) {
    Get-ChildItem "data/intraoral/processed/annotated_caries/labels/$split" -Filter *.txt | ForEach-Object {
        $lines = Get-Content $_.FullName
        foreach ($line in $lines) {
            if ($line.Trim() -ne "") {
                $parts = $line.Trim() -split '\s+'
                if ($parts.Length -ge 1) {
                    $cid = [int]$parts[0]
                    if ($cid -eq 0) { $class0Count++ }
                    elseif ($cid -eq 1) { $class1Count++ }
                    else { $invalidClassIds += "$($split)/$($_.Name): class $cid" }
                }
            }
        }
    }
}

Write-Host "   Class 0 (permanent_caries): $class0Count boxes"
Write-Host "   Class 1 (primary_caries): $class1Count boxes"
Write-Host ""

if ($invalidClassIds.Count -gt 0) {
    $errors += "Found invalid class IDs: $($invalidClassIds.Count)"
    $invalidClassIds | ForEach-Object { Write-Host "     - $_" -ForegroundColor Red }
}

# 5. Check for out-of-bounds coordinates
Write-Host "5. Checking for out-of-bounds coordinates..." -ForegroundColor Yellow
$outOfBounds = @()

foreach ($split in $splits) {
    Get-ChildItem "data/intraoral/processed/annotated_caries/labels/$split" -Filter *.txt | ForEach-Object {
        $lines = Get-Content $_.FullName
        foreach ($line in $lines) {
            if ($line.Trim() -ne "") {
                $parts = $line.Trim() -split '\s+'
                if ($parts.Length -eq 5) {
                    $cx = [double]$parts[1]
                    $cy = [double]$parts[2]
                    $w = [double]$parts[3]
                    $h = [double]$parts[4]
                    
                    if ($cx -lt 0 -or $cx -gt 1 -or $cy -lt 0 -or $cy -gt 1 -or $w -le 0 -or $w -gt 1 -or $h -le 0 -or $h -gt 1) {
                        $outOfBounds += "$($split)/$($_.Name)"
                    }
                }
            }
        }
    }
}

Write-Host "   Out-of-bounds boxes: $($outOfBounds.Count)"
Write-Host ""

if ($outOfBounds.Count -gt 0) {
    $errors += "Found $($outOfBounds.Count) out-of-bounds boxes after correction"
}

# 6. Check image-label correspondence
Write-Host "6. Checking image-label correspondence..." -ForegroundColor Yellow
$mismatched = @()

foreach ($split in $splits) {
    $imageFiles = Get-ChildItem "data/intraoral/processed/annotated_caries/images/$split" -Filter *.jpg | ForEach-Object { $_.Name -replace '\.jpg$', '' }
    $labelFiles = Get-ChildItem "data/intraoral/processed/annotated_caries/labels/$split" -Filter *.txt | ForEach-Object { $_.Name -replace '\.txt$', '' }
    
    $missingLabels = $imageFiles | Where-Object { $_ -notin $labelFiles }
    $missingImages = $labelFiles | Where-Object { $_ -notin $imageFiles }
    
    foreach ($ml in $missingLabels) { $mismatched += "$($split): missing label for $ml.jpg" }
    foreach ($mi in $missingImages) { $mismatched += "$($split): missing image for $mi.txt" }
}

Write-Host "   Mismatches: $($mismatched.Count)"
Write-Host ""

if ($mismatched.Count -gt 0) {
    $errors += "Found image-label mismatches: $($mismatched.Count)"
}

# 7. Check for duplicates
Write-Host "7. Checking for duplicate filenames..." -ForegroundColor Yellow
$duplicates = @()

foreach ($split in $splits) {
    $imageNames = Get-ChildItem "data/intraoral/processed/annotated_caries/images/$split" -Filter *.jpg | Select-Object -ExpandProperty Name
    $labelNames = Get-ChildItem "data/intraoral/processed/annotated_caries/labels/$split" -Filter *.txt | Select-Object -ExpandProperty Name
    
    if (($imageNames | Group-Object | Where-Object { $_.Count -gt 1 }).Count -gt 0) {
        $duplicates += "$($split): duplicate image files"
    }
    if (($labelNames | Group-Object | Where-Object { $_.Count -gt 1 }).Count -gt 0) {
        $duplicates += "$($split): duplicate label files"
    }
}

Write-Host "   Duplicates: $($duplicates.Count)"
Write-Host ""

if ($duplicates.Count -gt 0) {
    $errors += "Found duplicate filenames: $($duplicates.Count)"
}

# 8. Check data.yaml
Write-Host "8. Checking data.yaml..." -ForegroundColor Yellow
$dataYaml = Get-Content "data/intraoral/processed/annotated_caries/data.yaml" -Raw
Write-Host "   data.yaml exists: $([string](Test-Path "data/intraoral/processed/annotated_caries/data.yaml"))"
Write-Host ""

if (-not (Test-Path "data/intraoral/processed/annotated_caries/data.yaml")) {
    $errors += "data.yaml not found"
}

# Summary
Write-Host "=== VALIDATION SUMMARY ===" -ForegroundColor Cyan
Write-Host "Errors: $($errors.Count)" -ForegroundColor $(if ($errors.Count -eq 0) { "Green" } else { "Red" })
Write-Host "Warnings: $($warnings.Count)" -ForegroundColor Yellow
Write-Host ""

if ($errors.Count -gt 0) {
    Write-Host "ERRORS:" -ForegroundColor Red
    $errors | ForEach-Object { Write-Host "  - $_" -ForegroundColor Red }
    Write-Host ""
}

if ($warnings.Count -gt 0) {
    Write-Host "WARNINGS:" -ForegroundColor Yellow
    $warnings | ForEach-Object { Write-Host "  - $_" -ForegroundColor Yellow }
    Write-Host ""
}

if ($errors.Count -eq 0) {
    Write-Host "VALIDATION PASSED" -ForegroundColor Green
} else {
    Write-Host "VALIDATION FAILED" -ForegroundColor Red
}

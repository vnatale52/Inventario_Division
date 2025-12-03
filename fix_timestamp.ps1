$file = "c:\Users\vn\Desktop\Inventario División\app\server\index.js"
$content = Get-Content $file -Raw

# Replace the malformed timestamp code
$old = @"
        const argentinaTime = new Date(utc - (3600000 * 3)); // UTC-3
            timeZone: 'America/Argentina/Buenos_Aires',
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false
        }).replace(/\//g, '-').replace(/,/g, '').replace(/:/g, '-').replace(/ /g, '_');
        
        const filename = `${username}_backup_${argentinaDate}.csv`;
"@

$new = @"
        const argentinaTime = new Date(utc - (3600000 * 3)); // UTC-3
        
        const pad = (n) => n.toString().padStart(2, '0');
        const dateStr = `${pad(argentinaTime.getDate())}-${pad(argentinaTime.getMonth() + 1)}-${argentinaTime.getFullYear()}`;
        const timeStr = `${pad(argentinaTime.getHours())}-${pad(argentinaTime.getMinutes())}-${pad(argentinaTime.getSeconds())}`;
        
        const filename = `${username}_backup_${dateStr}_${timeStr}.csv`;
"@

$content = $content.Replace($old, $new)
Set-Content $file -Value $content -NoNewline

Write-Host "File fixed successfully"

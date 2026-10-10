$ErrorActionPreference = 'Stop'
$root = 'C:\Users\Mr Li\Desktop\hellogithub-clone'
$node = 'C:\Program Files\nodejs\node.exe'

foreach ($n in @('HG-ForceTest-Temp', 'HelloGitHub-Mirror-DailySync')) {
  $t = Get-ScheduledTask -TaskName $n -ErrorAction SilentlyContinue
  if ($t) { Unregister-ScheduledTask -TaskName $n -Confirm:$false; Write-Output "removed old task: $n" }
}

$action = New-ScheduledTaskAction -Execute $node -Argument ('"' + $root + '\update.js"') -WorkingDirectory $root
$trigger = New-ScheduledTaskTrigger -Daily -At 9:00am
$settings = New-ScheduledTaskSettingsSet -StartWhenAvailable -ExecutionTimeLimit (New-TimeSpan -Minutes 30)
Register-ScheduledTask -TaskName 'HelloGitHub-Mirror-Daily-Sync' -Action $action -Trigger $trigger -Settings $settings -Force | Out-Null
Write-Output 'daily task registered'

$fa = New-ScheduledTaskAction -Execute $node -Argument ('"' + $root + '\update.js" --force') -WorkingDirectory $root
Register-ScheduledTask -TaskName 'HG-ForceTest-Temp' -Action $fa -Trigger (New-ScheduledTaskTrigger -Once -At (Get-Date).AddDays(1)) -Settings $settings -Force | Out-Null
Write-Output 'temp force-test task registered'

$i = Get-ScheduledTask -TaskName 'HelloGitHub-Mirror-Daily-Sync' | Get-ScheduledTaskInfo
Write-Output ('daily next run: ' + $i.NextRunTime)
Start-ScheduledTask -TaskName 'HG-ForceTest-Temp'
Write-Output 'force-test started'

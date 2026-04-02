Commands.ForEachObjectCommand

# Find process on port 3000
$ netstat -ano | findstr :3000
TCP    0.0.0.0:3000           0.0.0.0:0              LISTENING       10052
  TCP    [::]:3000              [::]:0                 LISTENING       10052


  
# Kill node process
$ taskkill //PID 10052 //F 2>&1
SUCCESS: The process with PID 10052 has been terminated.
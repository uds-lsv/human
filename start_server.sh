screen -dL -m bash -c '
wait && pkill gunicorn ;


gunicorn -b 0.0.0.0:3002 -w 3 --log-level=debug --log-file server.log --capture-output start
'

echo "Started the server"

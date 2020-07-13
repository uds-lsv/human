screen -d -m bash -c 'pip install -e ./app/ ;
wait && pkill gunicorn ;

if [ -f "~/miniconda3/etc/profile.d/conda.sh" ]; then
                        . "~/miniconda3/etc/profile.d/conda.sh"
                                                    CONDA_CHANGEPS1=false conda activate human
fi

gunicorn -b <YOUR-IP-ADDRESS> -w 3 --log-level=debug start >> server.log'


echo "Started the server"

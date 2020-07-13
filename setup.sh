CONDA=~/miniconda3/etc/profile.d/conda.sh

if [ -f "$CONDA" ]; then     
echo "$CONDA exists."; 
fi

if [ -f "$CONDA" ]; then
        . "$CONDA"
        CONDA_CHANGEPS1=false 
        conda activate human
        echo "conda env acticated"
fi

echo
echo "Parsing protocol"
echo "---------------------"
cd app
python ap_parser.py ../protocol.json
if [ $? -eq 0 ]
then
  echo
  echo "Successfully parsed file"
  echo "---------------------"
else
  exit 1
fi
cd ..

echo
echo "Initializing database"
echo "---------------------"
flask init-db

flask add-admin

echo
echo "Installing node modules"
echo "---------------------"
npm install
npm start

echo
echo "---------------------"
echo "Now you can run 'flask run' with activated environment to start a local server on your machine."
echo "====================="
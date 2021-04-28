CONDA=~/miniconda3/etc/profile.d/conda.sh

if [ -f "$CONDA" ]; then
  echo "$CONDA exists."
fi

if [ -f "$CONDA" ]; then
  . "$CONDA"
  CONDA_CHANGEPS1=false
  conda activate human
  echo "conda env activated"
fi

echo
echo "Parsing protocol"
echo "---------------------"
cd app
python ap_parser.py ../protocol.json

if [ $? -eq 0 ]; then
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

if [ $? -ne 0 ]; then
  exit 1
fi

flask add-admin

if [ $? -ne 0 ]; then
  exit 1
fi

echo
echo "Installing node modules"
echo "---------------------"
npm install

if [ $? -ne 0 ]; then
  exit 1
fi

npm start

if [ $? -ne 0 ]; then
  exit 1
fi

echo
echo "---------------------"
echo "Now you can run 'flask run' with activated environment to start a local server on your machine."
echo "====================="

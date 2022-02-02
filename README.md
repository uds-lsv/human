# HUMAN

HUMAN is an annotation server that stands for...

-   **Hierarchical**: Supports annotation of hierarchical data. This makes it easy to annotate instances (e.g. online comments) together with their context (e.g. the thread of comments a comment was posted in).
-   **Universal**: Handles both textual data with and without context as well as PDFs and image annotation.
-   **Modular**: Various question types (labeling questions, multiple-choice, yes-no, setting bounding boxes etc.) that are self-contained and can be arranged in any order needed. This also makes it easy to implement new custom question types and features.
-   **ANnotator**: Comes with an easy to use GUI interface for your annotators and project manager.

# Try our [DEMO](http://human.lsv.uni-saarland.de)!



## Installation and Setup

The only requirement is a working version of python 3.9.x. Using anaconda or [https://docs.conda.io/en/latest/miniconda.html](miniconda) for a python environment is highly recommended.

The setup consists of 5 parts:
1. [Python environment](#python-environment)
2. [Database setup](#database-setup)
3. [Annotation protocol](#annotation-protocol)
4. [Deploy server](#deploy-server)
5. [Add data](#add-data)


### Python environment

First install the python environment.

With Conda:

```sh
conda env create
```

then activate the environment with

```sh
conda activate human
```

OR install from requirements.txt with pip or whatever you fancy.

```sh
pip install -r requirements.txt
```

### Database setup

First initialize the database with

```sh
flask init-db
```

Then add an admin account with

```sh
flask add-admin
```

### Annotation protocol

Write your custom annotation protocol into protocol.yml. Refer to the [wiki](https://github.com/uds-lsv/human/wiki) for documentation on how to do this and see our example protocols (under `/examples`) for inspiration.

Whenever you change any state names in protocol.yml, afterwards be sure to run

```sh
flask run reset-annotations
```

This will reset the annotations table in the database and is necessary to properly save annotations after a change in the protocol.


### Deploy server

To run a server you have 2 possibilities:

#### 1. Run locally on your machine
Locally you can start a server  with
```sh
flask start
```
and visit http://127.0.0.1:5000 in your favorite browser and login with your admin account.
However it is very ill advised to use this with an open port in a production environment.

#### 2. Deploy in a production environment
When running HUMAN in a production environment on a server we recommend using gunicorn (included in the environment). First, you should set a secure SECRET_KEY in config.py. The script `start_server.sh` should take care of starting the server.

For docker refer to the [https://github.com/uds-lsv/human/wiki/Docker/](wiki).

### Adding data

To add a file with data, start the server, log in with your admin account, and go to "Data Console". There you can upload the file.
Be sure that it is a tab separated file with the three columns "content", "context" and "meta".

When you want to display files you can use "Upload Folder" in "Data Console" and then upload a file with `<folder-name>/<file-name>` in the content fields for every file in the folder.

# Try our Examples!

WIP

<!-- Picture Annotation:

1. Copy and rename `/example/protocol_example_picture.json` to `/protocol.json`
2. Run `setup.sh`
3. Log in with your administrator account and upload the folder `/example/picture`
4. Upload the file `/example/data_example_picture.csv`
5. Go back to home and start annotating.

Text Annotation:

1. Copy and rename `/example/protocol_example_text.json` to `/protocol.json`
2. Run `setup.sh`
3. Log in with your administrator account and upload the file `/example/data_example_text.csv`
4. Go back to home and start annotating. -->

# Development

To make it easier to install, update and remove node, especially if you plan to maybe use it in other projects we recommend using the node version manager https://github.com/nvm-sh/nvm.

When debugging and working on client side code it is very convenient to let webpack watch file changes and transpile your code automatically: `npm run watch`

# Full Documentation

Visit the [wiki](https://github.com/uds-lsv/human/wiki) for full documentation.

# Authors

https://github.com/RainbowRevenge

https://github.com/ruitedk6

https://github.com/GeetDsa

# Paper

https://arxiv.org/abs/2010.01080

# Licence

HUMAN is licensed under GPL-3.
